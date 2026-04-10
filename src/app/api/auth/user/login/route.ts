import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getClientIp } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  createPlayerSession,
  verifyPlayerCredentials,
  setPlayerSessionCookie,
} from "@/lib/user-auth";
import { playerLoginSchema } from "@/lib/user-schema";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;
const PENDING_2FA_TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);
  const limit = consumeRateLimit(`player-login:${ipAddress}`, {
    limit: LOGIN_ATTEMPT_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const parsed = playerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const result = await verifyPlayerCredentials(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { message: "Email ou senha inválidos." },
      { status: 401 },
    );
  }

  // Check if user has 2FA enabled
  const totpDevice = await prisma.totpDevice.findUnique({
    where: { userId: result.user.id },
    select: { isEnabled: true },
  });

  if (totpDevice?.isEnabled) {
    // Create a pending 2FA token instead of a real session
    const pendingToken = randomBytes(32).toString("hex");
    const identifier = `2fa-pending:${result.user.id}`;

    // Clean up old pending tokens
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(pendingToken),
        expires: new Date(Date.now() + PENDING_2FA_TTL_MS),
      },
    });

    return NextResponse.json({
      ok: true,
      requires2fa: true,
      pendingToken,
      emailVerified: !!result.user.emailVerified,
    });
  }

  // No 2FA — create session normally
  const token = await createPlayerSession({
    userId: result.user.id,
    ipAddress,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const response = NextResponse.json({
    ok: true,
    emailVerified: !!result.user.emailVerified,
    user: {
      id: result.user.id,
      email: result.user.email,
      displayName: result.user.displayName,
    },
  });

  setPlayerSessionCookie(response, token);

  await recordAnalyticsEvent({
    type: "player_login",
    path: "/login",
    userId: result.user.id,
  });

  await applyGamificationEvent(result.user.id, "login");

  return response;
}
