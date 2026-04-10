import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { trackAdReward } from "@/data/monetizationStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { rewardType?: string; rewardAmount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const rewardType = body.rewardType?.trim() || "xp";
  const rewardAmount = Number(body.rewardAmount) || 0;

  try {
    const result = await trackAdReward(session.userId, rewardType, rewardAmount);
    
    // Trigger gamification event for ad view
    await applyGamificationEvent(session.userId, "ad_reward_view");
    
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[ads] trackAdReward error:", err);
    return NextResponse.json({ error: "Erro ao registrar recompensa." }, { status: 500 });
  }
}
