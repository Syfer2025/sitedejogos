import {
  buildPersonalizationScores,
  scoreGameForPersonalization,
  summarizePersonalizationScores,
} from "@/lib/personalization";

describe("personalization", () => {
  it("resume categorias e tags dominantes do jogador", () => {
    const scores = buildPersonalizationScores({
      preferredCategories: ["Racing", "Arcade"],
      favorites: [
        { category: "Racing", tags: ["drift", "neon"] },
        { category: "Racing", tags: ["nitro"] },
      ],
      history: [
        { category: "Racing", tags: ["drift", "street"], playCount: 4 },
        { category: "Arcade", tags: ["pixel"], playCount: 2 },
      ],
    });
    const profile = summarizePersonalizationScores(scores);

    expect(profile.dominantCategory).toBe("Racing");
    expect(profile.dominantTag).toBe("drift");
    expect(profile.mode).toBe("focused");
    expect(profile.topCategories[0]).toMatchObject({
      name: "Racing",
      score: 18,
    });
    expect(profile.favoriteCount).toBe(2);
    expect(profile.totalPlayCount).toBe(6);
  });

  it("prioriza jogos alinhados com categoria e tags do perfil", () => {
    const scores = buildPersonalizationScores({
      preferredCategories: ["Racing"],
      favorites: [{ category: "Racing", tags: ["drift", "nitro"] }],
      history: [{ category: "Racing", tags: ["drift"], playCount: 3 }],
    });

    const alignedScore = scoreGameForPersonalization(
      {
        category: "Racing",
        tags: ["drift", "time-trial"],
        featured: true,
        views: 1200,
      },
      scores,
    );
    const unrelatedScore = scoreGameForPersonalization(
      {
        category: "Puzzle",
        tags: ["logic"],
        featured: false,
        views: 1200,
      },
      scores,
    );

    expect(alignedScore).toBeGreaterThan(unrelatedScore);
  });
});