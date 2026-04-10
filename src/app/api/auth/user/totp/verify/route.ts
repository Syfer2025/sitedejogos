import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createPlayerSession, setPlayerSessionCookie } from "@/lib/user-auth";
import {
  decryptTotpSecret,
  verifyTotpCode,
  verifyBackupCode,
} from "@/lib/totp";

const schema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().trim().min(1, "Código obrigatório."),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = consumeRateLimit(`totp-verify:${ip}`, {
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
      { message: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  // Verify the pending 2FA token
  const hashed = hashToken(parsed.data.pendingToken);
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || !record.identifier.startsWith("2fa-pending:")) {
    return NextResponse.json(
      { message: "Sessão de verificação inválida ou expirada." },
      { status: 400 },
    );
  }

  if (record.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hashed } });
    return NextResponse.json(
      { message: "Sessão de verificação expirada. Faça login novamente." },
      { status: 400 },
    );
  }

  const userId = record.identifier.replace("2fa-pending:", "");

  // Get the user's TOTP device
  const device = await prisma.totpDevice.findUnique({
    where: { userId },
  });

  if (!device || !device.isEnabled) {
    return NextResponse.json(
      { message: "2FA não está configurado." },
      { status: 400 },
    );
  }

  const secret = decryptTotpSecret(device.encryptedSecret, device.iv);
  const code = parsed.data.code.replace(/[-\s]/g, "");

  // Try TOTP code first (6 digits)
  let valid = false;
  if (/^\d{6}$/.test(code)) {
    valid = verifyTotpCode(secret, code);
  }

  // If not a valid TOTP code, try backup code
  if (!valid) {
    const hashedCodes: string[] = device.backupCodes
      ? JSON.parse(device.backupCodes)
      : [];
    const result = verifyBackupCode(parsed.data.code, hashedCodes);
    valid = result.valid;

    if (result.valid) {
      // Update remaining backup codes
      await prisma.totpDevice.update({
        where: { userId },
        data: { backupCodes: JSON.stringify(result.remainingHashes) },
      });
    }
  }

  if (!valid) {
    return NextResponse.json(
      { message: "Código inválido." },
      { status: 401 },
    );
  }

  // Delete the pending token
  await prisma.verificationToken.delete({ where: { token: hashed } });

  // Get user data for response
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Usuário não encontrado." },
      { status: 400 },
    );
  }

  // Create the real session
  const sessionToken = await createPlayerSession({
    userId,
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  });

  setPlayerSessionCookie(response, sessionToken);

  return response;
}
