import { NextRequest, NextResponse } from "next/server";

import { getGameBySlug, listRelatedGames } from "@/data/gamesStore";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;
  const game = await getGameBySlug(slug, true);

  if (!game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relatedGames = await listRelatedGames(game, 4);

  return NextResponse.json({
    ...game,
    relatedGames,
  });
}