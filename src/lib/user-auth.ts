import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { PlayerLoginInput, PlayerRegisterInput } from "@/lib/user-schema";

export const PLAYER_SESSION_COOKIE = "player_session";
export const PLAYER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

// ── In-memory session cache (5-min TTL) ──
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;
const sessionCache = new Map<string, { data: any; expiresAt: number }>();

// ── Throttled cleanup: run clearExpiredPlayerSessions at most once per 10 min ──
let lastCleanupAt = 0;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

async function maybeCleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  clearExpiredPlayerSessions().catch(() => {});
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizePlayerEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function clearExpiredPlayerSessions() {
  await prisma.playerSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function registerPlayer(input: PlayerRegisterInput) {
  const email = normalizePlayerEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return {
      ok: false as const,
      reason: "email_taken" as const,
    };
  }

  const passwordHash = await hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      displayName: input.displayName.trim(),
      passwordHash,
    },
  });

  return {
    ok: true as const,
    user,
  };
}

export async function verifyPlayerCredentials(input: PlayerLoginInput) {
  const email = normalizePlayerEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const passwordMatches = await compare(input.password, user.passwordHash);

  return passwordMatches
    ? { ok: true as const, user }
    : { ok: false as const, reason: "invalid" as const };
}

export async function createPlayerSession(input: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await clearExpiredPlayerSessions();

  const token = randomBytes(32).toString("hex");

  await prisma.playerSession.create({
    data: {
      userId: input.userId,
      tokenHash: hashToken(token),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: new Date(Date.now() + PLAYER_SESSION_MAX_AGE_SECONDS * 1000),
    },
  });

  return token;
}

export async function getPlayerSession(token: string) {
  // Throttled cleanup instead of running on every request
  maybeCleanupExpiredSessions();

  // Check in-memory cache first
  const cacheKey = hashToken(token);
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const session = await prisma.playerSession.findUnique({
    where: {
      tokenHash: cacheKey,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          isPremium: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.playerSession.deleteMany({ where: { id: session.id } });
    sessionCache.delete(cacheKey);
    return null;
  }

  // Cache the session for 5 minutes
  sessionCache.set(cacheKey, {
    data: session,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  });

  return session;
}

export async function getPlayerSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(PLAYER_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return getPlayerSession(token);
}

export async function deletePlayerSession(token: string) {
  const tokenHash = hashToken(token);
  sessionCache.delete(tokenHash);
  await prisma.playerSession.deleteMany({
    where: {
      tokenHash,
    },
  });
}

export async function invalidateAllPlayerSessions(userId: string) {
  sessionCache.clear();
  await prisma.playerSession.deleteMany({
    where: { userId },
  });
}

export function setPlayerSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(PLAYER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLAYER_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearPlayerSessionCookie(response: NextResponse) {
  response.cookies.set(PLAYER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}