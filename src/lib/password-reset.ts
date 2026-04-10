import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildPasswordResetEmailHtml } from "@/lib/email-templates";
import { SITE_CONFIG } from "@/lib/config";
import { invalidateAllPlayerSessions } from "@/lib/user-auth";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function identifier(email: string) {
  return `pwd-reset:${email.trim().toLowerCase()}`;
}

export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, displayName: true, passwordHash: true },
  });

  // Only allow password reset for users with a password (not OAuth-only)
  if (!user || !user.passwordHash) {
    return null;
  }

  const id = identifier(normalizedEmail);

  // Remove any existing tokens
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

export async function sendPasswordResetEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { displayName: true },
  });

  const rawToken = await createPasswordResetToken(normalizedEmail);

  // If user doesn't exist or is OAuth-only, silently return (anti-enumeration)
  if (!rawToken || !user) return;

  const resetUrl = `${SITE_CONFIG.url}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: normalizedEmail,
    subject: `Redefinir senha — ${SITE_CONFIG.name}`,
    html: buildPasswordResetEmailHtml({
      displayName: user.displayName,
      resetUrl,
    }),
  });
}

export async function verifyPasswordResetToken(
  rawToken: string,
): Promise<
  { ok: true; email: string } | { ok: false; reason: "invalid" | "expired" }
> {
  const hashed = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || !record.identifier.startsWith("pwd-reset:")) {
    return { ok: false, reason: "invalid" };
  }

  if (record.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hashed } });
    return { ok: false, reason: "expired" };
  }

  const email = record.identifier.replace("pwd-reset:", "");
  return { ok: true, email };
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const hashed = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || !record.identifier.startsWith("pwd-reset:")) {
    return { ok: false, reason: "invalid" };
  }

  if (record.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hashed } });
    return { ok: false, reason: "expired" };
  }

  const email = record.identifier.replace("pwd-reset:", "");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { ok: false, reason: "invalid" };
  }

  const passwordHash = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate all sessions so user must re-login
  await invalidateAllPlayerSessions(user.id);

  // Delete the used token
  await prisma.verificationToken.delete({ where: { token: hashed } });

  return { ok: true };
}
