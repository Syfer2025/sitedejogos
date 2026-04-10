import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { sendVerificationEmail } from "@/lib/verification";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = consumeRateLimit(`resend-verify:${ip}`, {
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  if (session.user.emailVerified) {
    return NextResponse.json(
      { message: "Email já verificado." },
      { status: 400 },
    );
  }

  await sendVerificationEmail({
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
  });

  return NextResponse.json({ ok: true });
}
