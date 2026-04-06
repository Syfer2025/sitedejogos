import { buildDailyMission, selectDailyMissionTemplate } from "@/lib/daily-missions";

describe("daily missions", () => {
  it("prioriza missão de favorito quando o jogador ainda não salvou jogos", () => {
    expect(
      selectDailyMissionTemplate({
        favoriteCount: 0,
        hasProfileSetup: false,
      }),
    ).toEqual({
      kind: "favorite_add",
      targetCount: 1,
      rewardXp: 25,
    });
  });

  it("prioriza perfil quando já há favoritos mas o perfil ainda está incompleto", () => {
    expect(
      selectDailyMissionTemplate({
        favoriteCount: 2,
        hasProfileSetup: false,
      }),
    ).toEqual({
      kind: "profile_update",
      targetCount: 1,
      rewardXp: 25,
    });
  });

  it("mostra estado concluído para missão diária finalizada", () => {
    const mission = buildDailyMission({
      locale: "pt-BR",
      isAuthenticated: true,
      mission: {
        id: "mission-1",
        dayToken: "2026-04-05",
        kind: "game_play",
        targetCount: 2,
        progressCount: 2,
        rewardXp: 30,
        isCompleted: true,
        completedAt: "2026-04-05T12:00:00.000Z",
      },
    });

    expect(mission).toMatchObject({
      variant: "completed",
      href: "/games",
      ctaLabel: "Ver conta",
      isCompleted: true,
    });
    expect(mission.title).toBe("Missão diária concluída.");
    expect(mission.progressValue).toBe("Concluída • +30 XP");
  });
});