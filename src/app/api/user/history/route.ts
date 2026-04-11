import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyGamificationEvent } from "@/data/gamificationStore";
import { listRecentlyPlayed, recordRecentlyPlayed } from "@/data/playerStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 24);
  const history = await listRecentlyPlayed(
    session.userId,
    Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 24) : 24,
  );
  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { gameId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const gameId = body.gameId?.trim();
  if (!gameId) {
    return NextResponse.json({ error: "gameId é obrigatório." }, { status: 400 });
  }

  const result = await recordRecentlyPlayed(session.userId, gameId);
  if (!result) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const gamificationResult = await applyGamificationEvent(session.userId, "game_play");
  
  return NextResponse.json({ 
    ok: true, 
    newlyUnlocked: gamificationResult?.newlyUnlocked ?? [],
    rankChanged: gamificationResult?.rankChanged ?? false,
    newRank: gamificationResult?.newRank
  });
}