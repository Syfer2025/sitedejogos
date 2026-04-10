import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rateGame } from "@/data/gamesStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { gameId?: string; value?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const gameId = body.gameId?.trim();
  const value = Number(body.value);

  if (!gameId) {
    return NextResponse.json({ error: "gameId é obrigatório." }, { status: 400 });
  }

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "O valor deve estar entre 1 e 5 estrelas." }, { status: 400 });
  }

  try {
    const result = await rateGame(session.userId, gameId, value);
    
    // Trigger gamification event for rating
    await applyGamificationEvent(session.userId, "rating_add");
    
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[ratings] rateGame error:", err);
    return NextResponse.json({ error: "Erro ao registrar avaliação." }, { status: 500 });
  }
}
