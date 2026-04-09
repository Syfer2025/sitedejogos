import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    req.nextUrl.searchParams.get("cron_secret") === cronSecret;

  if (process.env.NODE_ENV === "production" && !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [deletedAnalytics, deletedSessions] = await Promise.all([
    prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    }),
    prisma.playerSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    deletedAnalytics: deletedAnalytics.count,
    deletedSessions: deletedSessions.count,
  });
}
