import { createGameInputSchema, slugify } from "@/lib/game-schema";

describe("game schema", () => {
  it("normaliza slug com acentos e espaços", () => {
    expect(slugify("Ação Turbo 2026!!!")) .toBe("acao-turbo-2026");
  });

  it("converte string de tags em array limpo", () => {
    const parsed = createGameInputSchema.parse({
      title: "Quantum Drift",
      iframeUrl: "https://example.com/game",
      thumbnail: "https://example.com/thumb.png",
      tags: " arcade, neon ,, racing ",
    });

    expect(parsed.tags).toEqual(["arcade", "neon", "racing"]);
    expect(parsed.isPublished).toBe(true);
  });
});