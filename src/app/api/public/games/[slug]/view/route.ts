import { NextRequest, NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { incrementGameViews } from "@/data/gamesStore";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const { slug } = await params;
  let sessionId: string | undefined;
  let referrer: string | undefined;

  try {
    const body = (await req.json()) as { sessionId?: string; referrer?: string };
    sessionId = body.sessionId?.trim().slice(0, 80) || undefined;
    referrer = body.referrer?.trim().slice(0, 240) || undefined;
  } catch {
    sessionId = undefined;
    referrer = undefined;
  }

  const limit = consumeRateLimit(`public-view:${slug}:${ipAddress}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json({ ok: true, rateLimited: true });
  }

  const game = await incrementGameViews(slug);
  const playerSession = await getPlayerSessionFromRequest(req);

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await recordAnalyticsEvent({
    type: "game_view",
    path: `/games/${slug}`,
    sessionId,
    userId: playerSession?.user.id,
    gameId: game.id,
    referrer,
  });

  return NextResponse.json({ ok: true, views: game.views });
}