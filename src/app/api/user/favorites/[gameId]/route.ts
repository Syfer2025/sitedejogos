import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { removeFavoriteGame } from "@/data/playerStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

type RouteContext = {
  params: Promise<{ gameId: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await params;
  const result = await removeFavoriteGame(session.userId, gameId);
  return NextResponse.json(result);
}