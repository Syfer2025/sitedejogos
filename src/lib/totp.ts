import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {
  generateSecret,
  generateURI,
  verifySync,
} from "otplib";
import QRCode from "qrcode";

import { SITE_CONFIG } from "@/lib/config";

// ── Encryption (AES-256-GCM) ──

function getEncryptionKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptTotpSecret(secret: string): {
  encrypted: string;
  iv: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted: encrypted + ":" + authTag,
    iv: iv.toString("hex"),
  };
}

export function decryptTotpSecret(encrypted: string, iv: string): string {
  const key = getEncryptionKey();
  const [ciphertext, authTag] = encrypted.split(":");

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ── TOTP Operations ──

export function generateTotpSecretKey(): string {
  // Scure-base32 plugin (used internally by otplib v4) crashes if there is padding.
  return generateSecret().replace(/=/g, "");
}

export function generateTotpUri(secret: string, email: string): string {
  return generateURI({
    issuer: SITE_CONFIG.name,
    label: email,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}

export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: { dark: "#e2e8f0", light: "#0f172a" },
  });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  // epochTolerance of 30 seconds allows 1 step drift (period = 30s)
  const result = verifySync({ secret, token: code, epochTolerance: 30 });
  return result.valid;
}

// ── Backup Codes ──

const BACKUP_CODE_COUNT = 8;

function formatBackupCode(bytes: Buffer): string {
  const num = bytes.readUInt32BE(0) % 100000000;
  const str = num.toString().padStart(8, "0");
  return str.slice(0, 4) + "-" + str.slice(4);
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(formatBackupCode(randomBytes(4)));
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  const normalized = code.replace(/[-\s]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

export function verifyBackupCode(
  code: string,
  hashedCodes: string[],
): { valid: boolean; remainingHashes: string[] } {
  const inputHash = hashBackupCode(code);
  const idx = hashedCodes.indexOf(inputHash);

  if (idx === -1) {
    return { valid: false, remainingHashes: hashedCodes };
  }

  // Remove the used code
  const remaining = [...hashedCodes];
  remaining.splice(idx, 1);
  return { valid: true, remainingHashes: remaining };
}
