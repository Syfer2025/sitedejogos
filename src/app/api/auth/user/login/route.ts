import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  createPlayerSession,
  verifyPlayerCredentials,
  setPlayerSessionCookie,
} from "@/lib/user-auth";
import { playerLoginSchema } from "@/lib/user-schema";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;

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
    type: "player_login",
    path: "/login",
    userId: result.user.id,
  });

  await applyGamificationEvent(result.user.id, "login");

  return response;
}
