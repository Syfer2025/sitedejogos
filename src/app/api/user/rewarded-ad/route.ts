import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { canClaimReward, claimAdReward } from "@/lib/rewarded-ads";

export async function GET(request: NextRequest) {
  const session = await getPlayerSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const status = await canClaimReward(session.user.id);
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const session = await getPlayerSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rewardType = body?.rewardType ?? "coins";

  const result = await claimAdReward(session.user.id, rewardType);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "daily_limit" ? "Limite diário atingido." : "Aguarde o cooldown." },
      { status: 429 },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
