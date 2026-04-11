import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { getPlayerGamificationOverview } from "@/data/gamificationStore";
import { listAchievementDefinitions } from "@/data/achievementDefinitionsStore";

export async function GET(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [overview, definitions] = await Promise.all([
      getPlayerGamificationOverview(session.userId),
      listAchievementDefinitions(),
    ]);

    return NextResponse.json({
      level: overview?.level ?? 1,
      xp: overview?.xp ?? 0,
      currentStreak: overview?.currentStreak ?? 0,
      coins: 0, // TODO: Adicionar coins ao retorno de getPlayerGamificationOverview
      unlockedAchievementKeys: overview?.unlockedAchievementKeys ?? [],
      achievementSnapshot: overview?.achievementSnapshot ?? null,
      achievementDefinitions: definitions.map((d) => ({
        id: d.id,
        key: d.key,
        title: d.title,
        description: d.description,
        icon: d.icon,
        imageUrl: d.imageUrl,
        xpReward: d.xpReward,
        coinReward: d.coinReward,
        criteriaType: d.criteriaType,
        threshold: d.threshold,
      })),
    });
  } catch (err) {
    console.error("[gamification-overview] error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
