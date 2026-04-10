import { compare } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 4;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!adminEmail || !adminPasswordHash) {
    return { ok: false as const, reason: "missing_config" as const };
  }

  if (email.trim().toLowerCase() !== adminEmail) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const isPasswordValid = await compare(password, adminPasswordHash);

  return {
    ok: isPasswordValid,
    reason: isPasswordValid ? ("ok" as const) : ("invalid" as const),
  };
}

export async function clearExpiredAdminSessions() {
  await prisma.adminSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function createAdminSession(input: {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await clearExpiredAdminSessions();

  const token = randomBytes(32).toString("hex");

  await prisma.adminSession.create({
    data: {
      email: input.email.toLowerCase(),
      tokenHash: hashToken(token),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return token;
}

export async function getAdminSession(token: string) {
  await clearExpiredAdminSessions();

  const session = await prisma.adminSession.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.deleteMany({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session;
}

export async function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return getAdminSession(token);
}

export async function deleteAdminSession(token: string) {
  await prisma.adminSession.deleteMany({
    where: {
      tokenHash: hashToken(token),
    },
  });
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}