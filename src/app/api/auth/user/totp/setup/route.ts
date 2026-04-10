import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import {
  generateTotpSecretKey,
  generateTotpUri,
  generateQrCodeDataUrl,
  encryptTotpSecret,
} from "@/lib/totp";

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  // Check if 2FA is already enabled
  const existing = await prisma.totpDevice.findUnique({
    where: { userId: session.user.id },
  });

  if (existing?.isEnabled) {
    return NextResponse.json(
      { message: "2FA já está ativado." },
      { status: 409 },
    );
  }

  // Delete any pending (not yet enabled) setup
  if (existing && !existing.isEnabled) {
    await prisma.totpDevice.delete({ where: { userId: session.user.id } });
  }

  const secret = generateTotpSecretKey();
  const uri = generateTotpUri(secret, session.user.email);
  const qrCodeDataUrl = await generateQrCodeDataUrl(uri);
  const { encrypted, iv } = encryptTotpSecret(secret);

  await prisma.totpDevice.create({
    data: {
      userId: session.user.id,
      encryptedSecret: encrypted,
      iv,
      isEnabled: false,
    },
  });

  return NextResponse.json({
    ok: true,
    qrCodeDataUrl,
    uri,
  });
}
