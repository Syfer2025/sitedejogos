import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { addFavoriteGame, listFavoriteGames } from "@/data/playerStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 24);
  const favorites = await listFavoriteGames(
    session.userId,
    Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 24) : 24,
  );
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { gameId?: string; sessionId?: string; referrer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const gameId = body.gameId?.trim();
  const sessionId = body.sessionId?.trim().slice(0, 80) || undefined;
  const referrer = body.referrer?.trim().slice(0, 240) || undefined;
  if (!gameId) {
    return NextResponse.json({ error: "gameId é obrigatório." }, { status: 400 });
  }

  const result = await addFavoriteGame(session.userId, gameId);
  if (!result) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  if (result.created) {
    await recordAnalyticsEvent({
      type: "favorite_add",
      path: result.game ? `/games/${result.game.slug}` : "/games",
      sessionId,
      userId: session.userId,
      gameId: result.game?.id,
      referrer,
    });

    await applyGamificationEvent(session.userId, "favorite_add");
  }

  return NextResponse.json(result, { status: 201 });
}