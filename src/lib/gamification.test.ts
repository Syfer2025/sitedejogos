import {
  matchesAchievementCriteria,
  getCalendarDayDiff,
  getLevelFromXp,
  getLevelProgress,
} from "@/lib/gamification";

describe("gamification helpers", () => {
  it("calcula nível com base no XP acumulado", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(99)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(250)).toBe(3);
  });

  it("gera progresso percentual dentro do nível atual", () => {
    expect(getLevelProgress(145)).toMatchObject({
      level: 2,
      currentLevelXp: 100,
      nextLevelXp: 200,
      progressInLevel: 45,
      neededInLevel: 100,
      progressPercent: 45,
    });
  });

  it("mede diferença de dias em calendário UTC", () => {
    expect(
      getCalendarDayDiff(
        new Date("2026-04-03T23:59:00.000Z"),
        new Date("2026-04-05T00:01:00.000Z"),
      ),
    ).toBe(2);
  });

  it("avalia critérios dinâmicos de conquista", () => {
    const snapshot = {
      accountCreated: true,
      totalGamesPlayed: 12,
      uniqueGamesPlayed: 5,
      totalFavorites: 3,
      currentStreak: 4,
      hasProfileSetup: true,
      totalXp: 285,
      level: 3,
    };

    expect(
      matchesAchievementCriteria(
        { criteriaType: "games_played_total", threshold: 10 },
        snapshot,
      ),
    ).toBe(true);
    expect(
      matchesAchievementCriteria(
        { criteriaType: "favorites_total", threshold: 5 },
        snapshot,
      ),
    ).toBe(false);
    expect(
      matchesAchievementCriteria(
        { criteriaType: "profile_completed", threshold: 1 },
        snapshot,
      ),
    ).toBe(true);
  });
});