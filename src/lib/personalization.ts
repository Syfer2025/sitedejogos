export type PersonalizationFavoriteSignal = {
  category: string;
  tags: string[];
};

export type PersonalizationHistorySignal = {
  category: string;
  tags: string[];
  playCount: number;
};

export type PersonalizationScores = {
  categoryScores: Map<string, number>;
  tagScores: Map<string, number>;
  favoriteCount: number;
  recentGameCount: number;
  totalPlayCount: number;
};

export type PlayerTasteProfile = {
  favoriteCount: number;
  recentGameCount: number;
  totalPlayCount: number;
  dominantCategory: string | null;
  dominantTag: string | null;
  mode: "focused" | "hybrid" | "explorer";
  recommendationSummary: string;
  topCategories: Array<{
    name: string;
    score: number;
    share: number;
  }>;
  topTags: Array<{
    name: string;
    score: number;
  }>;
};

type RecommendationGameInput = {
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
};

function addScore(store: Map<string, number>, rawKey: string, weight: number) {
  const key = rawKey.trim();

  if (!key || weight <= 0) {
    return;
  }

  store.set(key, (store.get(key) ?? 0) + weight);
}

export function buildPersonalizationScores(input: {
  preferredCategories: string[];
  favorites: PersonalizationFavoriteSignal[];
  history: PersonalizationHistorySignal[];
}): PersonalizationScores {
  const categoryScores = new Map<string, number>();
  const tagScores = new Map<string, number>();

  input.favorites.forEach((entry) => {
    addScore(categoryScores, entry.category, 6);
    entry.tags.forEach((tag) => addScore(tagScores, tag, 3));
  });

  input.history.forEach((entry) => {
    const playWeight = Math.max(1, Math.min(entry.playCount, 8));
    addScore(categoryScores, entry.category, playWeight);
    entry.tags.forEach((tag) => addScore(tagScores, tag, Math.max(1, Math.ceil(playWeight / 2))));
  });

  input.preferredCategories.forEach((category, index) => {
    const weight = input.favorites.length === 0 && input.history.length === 0 ? 6 - index : 2;
    addScore(categoryScores, category, Math.max(weight, 1));
  });

  return {
    categoryScores,
    tagScores,
    favoriteCount: input.favorites.length,
    recentGameCount: input.history.length,
    totalPlayCount: input.history.reduce((total, entry) => total + Math.max(entry.playCount, 0), 0),
  };
}

export function summarizePersonalizationScores(
  scores: PersonalizationScores,
): PlayerTasteProfile {
  const sortedCategories = Array.from(scores.categoryScores.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  const sortedTags = Array.from(scores.tagScores.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  const totalCategoryScore = sortedCategories.reduce((total, [, score]) => total + score, 0);
  const dominantShare =
    totalCategoryScore > 0 && sortedCategories[0]
      ? (sortedCategories[0][1] / totalCategoryScore) * 100
      : 0;
  const mode =
    dominantShare >= 55 ? "focused" : dominantShare >= 35 ? "hybrid" : "explorer";
  const dominantCategory = sortedCategories[0]?.[0] ?? null;
  const dominantTag = sortedTags[0]?.[0] ?? null;

  return {
    favoriteCount: scores.favoriteCount,
    recentGameCount: scores.recentGameCount,
    totalPlayCount: scores.totalPlayCount,
    dominantCategory,
    dominantTag,
    mode,
    recommendationSummary: dominantCategory
      ? dominantTag
        ? `${dominantCategory} lidera seu perfil agora, com sinal forte em ${dominantTag}.`
        : `${dominantCategory} lidera seu perfil agora.`
      : scores.favoriteCount > 0 || scores.totalPlayCount > 0
      ? "Seu perfil já tem sinais úteis, mas ainda está espalhado entre várias trilhas."
      : "Complete preferências e histórico para deixar o feed mais preciso.",
    topCategories: sortedCategories.slice(0, 4).map(([name, score]) => ({
      name,
      score,
      share: totalCategoryScore > 0 ? Number(((score / totalCategoryScore) * 100).toFixed(1)) : 0,
    })),
    topTags: sortedTags.slice(0, 6).map(([name, score]) => ({
      name,
      score,
    })),
  };
}

export function scoreGameForPersonalization(
  game: RecommendationGameInput,
  scores: PersonalizationScores,
) {
  const categoryScore = scores.categoryScores.get(game.category.trim()) ?? 0;
  const tagScore = game.tags.reduce(
    (total, tag) => total + (scores.tagScores.get(tag.trim()) ?? 0),
    0,
  );

  return categoryScore * 12 + tagScore * 4 + (game.featured ? 8 : 0) + Math.min(game.views, 4000) / 250;
}