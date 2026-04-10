import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  createPlayerSession,
  registerPlayer,
  setPlayerSessionCookie,
} from "@/lib/user-auth";
import { playerRegisterSchema } from "@/lib/user-schema";
import { sendVerificationEmail } from "@/lib/verification";

const REGISTER_WINDOW_MS = 10 * 60 * 1000;
const REGISTER_ATTEMPT_LIMIT = 5;

export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);
  const limit = consumeRateLimit(`player-register:${ipAddress}`, {
    limit: REGISTER_ATTEMPT_LIMIT,
    windowMs: REGISTER_WINDOW_MS,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas de cadastro. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof body.sessionId === "string"
      ? body.sessionId.trim().slice(0, 80) || undefined
      : undefined;
  const referrer =
    typeof body === "object" &&
    body !== null &&
    "referrer" in body &&
    typeof body.referrer === "string"
      ? body.referrer.trim().slice(0, 240) || undefined
      : undefined;

  const parsed = playerRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const result = await registerPlayer(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { message: "Este email já está em uso." },
      { status: 409 },
    );
  }

  const token = await createPlayerSession({
    userId: result.user.id,
    ipAddress,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      displayName: result.user.displayName,
    },
  });

  setPlayerSessionCookie(response, token);

  await recordAnalyticsEvent({
    type: "player_register",
    path: "/login?mode=register",
    sessionId,
    userId: result.user.id,
    referrer,
  });

  await applyGamificationEvent(result.user.id, "register");

  // Send verification email (fire-and-forget — don't block registration)
  sendVerificationEmail({
    userId: result.user.id,
    email: result.user.email,
    displayName: result.user.displayName,
  }).catch((err) => {
    console.error("[register] Failed to send verification email:", err);
  });

  return response;
}