import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimitAsync } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/password-reset";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await consumeRateLimitAsync(`forgot-pwd:${ip}`, {
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informe um email válido." },
      { status: 400 },
    );
  }

  // Always return success to prevent email enumeration
  sendPasswordResetEmail(parsed.data.email).catch((err) => {
    console.error("[forgot-password] Failed to send reset email:", err);
  });

  return NextResponse.json({
    ok: true,
    message:
      "Se uma conta existir com esse email, enviaremos um link de redefinição.",
  });
}
