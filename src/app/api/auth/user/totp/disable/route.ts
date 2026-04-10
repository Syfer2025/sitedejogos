import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { decryptTotpSecret, verifyTotpCode, verifyBackupCode } from "@/lib/totp";

const schema = z.object({
  code: z.string().trim().min(1, "Código obrigatório."),
});

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = consumeRateLimit(`totp-disable:${session.user.id}`, {
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
      { message: parsed.error.issues[0]?.message ?? "Código inválido." },
      { status: 400 },
    );
  }

  const device = await prisma.totpDevice.findUnique({
    where: { userId: session.user.id },
  });

  if (!device || !device.isEnabled) {
    return NextResponse.json(
      { message: "2FA não está ativado." },
      { status: 400 },
    );
  }

  const secret = decryptTotpSecret(device.encryptedSecret, device.iv);
  const code = parsed.data.code.replace(/[-\s]/g, "");

  let valid = false;

  if (/^\d{6}$/.test(code)) {
    valid = verifyTotpCode(secret, code);
  }

  if (!valid) {
    const hashedCodes: string[] = device.backupCodes
      ? JSON.parse(device.backupCodes)
      : [];
    const result = verifyBackupCode(parsed.data.code, hashedCodes);
    valid = result.valid;
  }

  if (!valid) {
    return NextResponse.json(
      { message: "Código inválido." },
      { status: 401 },
    );
  }

  await prisma.totpDevice.delete({ where: { userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
