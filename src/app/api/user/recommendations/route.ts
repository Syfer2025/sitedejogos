import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listRecommendedGames } from "@/data/playerStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 6);
  const recommendations = await listRecommendedGames(
    session.userId,
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 8)
      : 6,
  );

  return NextResponse.json(recommendations);
}