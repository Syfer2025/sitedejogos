import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/admin-auth";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import {
  decryptTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/totp";

const schema = z.object({
  code: z.string().trim().length(6, "O código deve ter 6 dígitos."),
});

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = consumeRateLimit(`totp-setup:${session.user.id}`, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
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

  if (!device) {
    return NextResponse.json(
      { message: "Inicie o setup de 2FA primeiro." },
      { status: 400 },
    );
  }

  if (device.isEnabled) {
    return NextResponse.json(
      { message: "2FA já está ativado." },
      { status: 409 },
    );
  }

  const secret = decryptTotpSecret(device.encryptedSecret, device.iv);
  const valid = verifyTotpCode(secret, parsed.data.code);

  if (!valid) {
    return NextResponse.json(
      { message: "Código inválido. Verifique o app autenticador." },
      { status: 400 },
    );
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(hashBackupCode);

  await prisma.totpDevice.update({
    where: { userId: session.user.id },
    data: {
      isEnabled: true,
      backupCodes: JSON.stringify(hashedCodes),
    },
  });

  return NextResponse.json({
    ok: true,
    backupCodes,
  });
}
