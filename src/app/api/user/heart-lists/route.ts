import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

// GET — returns favorites, recents and rated games for the heart dropdown
export async function GET(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [favorites, recents, rated] = await Promise.all([
      prisma.favoriteGame.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { game: { select: { id: true, slug: true, title: true, thumbnail: true } } },
      }),
      prisma.recentlyPlayed.findMany({
        where: { userId: session.userId },
        orderBy: { lastPlayedAt: "desc" },
        take: 12,
        select: { game: { select: { id: true, slug: true, title: true, thumbnail: true } }, lastPlayedAt: true },
      }),
      prisma.gameRating.findMany({
        where: { userId: session.userId },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { value: true, game: { select: { id: true, slug: true, title: true, thumbnail: true } } },
      }),
    ]);

    return NextResponse.json({
      favorites: favorites.map((f) => f.game),
      recents: recents.map((r) => ({ ...r.game, lastPlayedAt: r.lastPlayedAt })),
      rated: rated.map((r) => ({ ...r.game, rating: r.value })),
    });
  } catch (err) {
    console.error("[heart-lists] GET error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
