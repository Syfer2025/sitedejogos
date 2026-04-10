import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildVerificationEmailHtml } from "@/lib/email-templates";
import { SITE_CONFIG } from "@/lib/config";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function identifier(userId: string) {
  return `email-verify:${userId}`;
}

export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  const id = identifier(userId);

  // Remove any existing tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: id },
  });

  const rawToken = randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      identifier: id,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_EXPIRY_MS),
    },
  });

  return rawToken;
}

export async function sendVerificationEmail(params: {
  userId: string;
  email: string;
  displayName: string;
}) {
  const rawToken = await createEmailVerificationToken(params.userId);
  const verifyUrl = `${SITE_CONFIG.url}/verify-email?token=${rawToken}`;

  await sendEmail({
    to: params.email,
    subject: `Verifique seu email — ${SITE_CONFIG.name}`,
    html: buildVerificationEmailHtml({
      displayName: params.displayName,
      verifyUrl,
    }),
  });
}

export async function verifyEmailToken(
  rawToken: string,
): Promise<
  { ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" }
> {
  const hashed = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || !record.identifier.startsWith("email-verify:")) {
    return { ok: false, reason: "invalid" };
  }

  // Clean up the used token
  await prisma.verificationToken.delete({
    where: { token: hashed },
  });

  if (record.expires.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const userId = record.identifier.replace("email-verify:", "");

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return { ok: true, userId };
}
