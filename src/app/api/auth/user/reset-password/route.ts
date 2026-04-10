import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { resetPassword } from "@/lib/password-reset";
import { playerRegisterPasswordSchema } from "@/lib/user-schema";

const schema = z.object({
  token: z.string().min(1),
  password: playerRegisterPasswordSchema,
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = consumeRateLimit(`reset-pwd:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
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
      { message: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const result = await resetPassword(parsed.data.token, parsed.data.password);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "Este link expirou. Solicite um novo."
        : "Link de redefinição inválido.";
    return NextResponse.json({ message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
