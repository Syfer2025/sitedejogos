import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { createGameInputSchema } from "@/lib/game-schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { listGames, createGame } from "@/data/gamesStore";

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const games = await listGames({
    category: searchParams.get("category") || undefined,
    query: searchParams.get("q") || undefined,
    featured:
      searchParams.get("featured") === "true"
        ? true
        : searchParams.get("featured") === "false"
        ? false
        : undefined,
    published:
      searchParams.get("published") === "true"
        ? true
        : searchParams.get("published") === "false"
        ? false
        : undefined,
    sortBy: searchParams.get("sort") === "popular" ? "popular" : "newest",
  });

  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-write:${session.id}`, {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 }
    );
  }

  try {
    const parsed = createGameInputSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
        { status: 400 }
      );
    }

    const game = await createGame(parsed.data);

    return NextResponse.json(game, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar jogo" }, { status: 500 });
  }
}
