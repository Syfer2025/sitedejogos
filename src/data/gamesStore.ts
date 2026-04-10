import type { Game } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { DEFAULT_GAMES } from "@/data/defaultGames";
import { sortCatalogCategories, type CatalogCategoryOrderMode } from "@/lib/catalog-category-order";
import type { CreateGameInput, UpdateGameInput } from "@/lib/game-schema";
import { buildPaginationMeta } from "@/lib/pagination";
import { slugify } from "@/lib/game-schema";
import { prisma } from "@/lib/prisma";

export type GameRecord = {
  id: string;
  title: string;
  slug: string;
  iframeUrl: string;
  thumbnail: string;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
  popularityScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  avgRating: number;
  ratingCount: number;
  isFavorited?: boolean;
  userRating?: number;
  // SEO fields
  longDescription: string;
  tips: string;
  controls: string;
  faqJson: string;
};

type ListGamesOptions = {
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  published?: boolean;
  publishedOnly?: boolean;
  query?: string;
  sortBy?: "newest" | "popular" | "random";
  currentUserId?: string;
};

export type PaginatedGamesResult = {
  items: GameRecord[];
  pagination: ReturnType<typeof buildPaginationMeta>;
};

export type CategoryShowcaseRecord = {
  category: string;
  totalGames: number;
  games: GameRecord[];
};

export type PaginatedCategoryShowcasesResult = {
  items: CategoryShowcaseRecord[];
  offset: number;
  limit: number;
  totalCategories: number;
  hasMore: boolean;
  nextOffset: number | null;
};

function normalizeTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function serializeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(",");
}

function mapGame(game: Game): GameRecord {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    iframeUrl: game.iframeUrl,
    thumbnail: game.thumbnail,
    description: game.description,
    category: game.category,
    tags: normalizeTags(game.tags),
    featured: game.featured,
    views: game.views,
    popularityScore: game.popularityScore,
    isPublished: game.isPublished,
    avgRating: 0,
    ratingCount: 0,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    longDescription: game.longDescription,
    tips: game.tips,
    controls: game.controls,
    faqJson: game.faqJson,
  };
}

export async function seedDefaultGamesIfEmpty() {
  const gamesCount = await prisma.game.count();

  if (gamesCount > 0) {
    return 0;
  }

  await prisma.game.createMany({
    data: DEFAULT_GAMES.map((game) => ({
      ...game,
      slug: slugify(game.title),
      tags: serializeTags(game.tags),
      isPublished: true,
    })),
  });

  return DEFAULT_GAMES.length;
}

async function makeUniqueSlug(title: string) {
  const baseSlug = slugify(title);
  let nextSlug = baseSlug;
  let counter = 1;

  while (
    await prisma.game.findUnique({
      where: { slug: nextSlug },
      select: { id: true },
    })
  ) {
    nextSlug = `${baseSlug}-${counter++}`;
  }

  return nextSlug;
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

import { unstable_cache } from "next/cache";

async function _listGames(options: ListGamesOptions = {}) {
  const where: Prisma.GameWhereInput = {
    ...(typeof options.published === "boolean"
      ? { isPublished: options.published }
      : options.publishedOnly
      ? { isPublished: true }
      : {}),
    ...(options.featured !== undefined ? { featured: options.featured } : {}),
    ...(options.category && options.category !== "all"
      ? { category: options.category }
      : {}),
    ...(options.query
      ? {
          OR: [
            { title: { contains: options.query } },
            { category: { contains: options.query } },
            { tags: { contains: options.query } },
          ],
        }
      : {}),
  };

  // Always cache-able, never include individual favorites in the huge query
  const include: any = {
    ratings: {
      select: { value: true }
    },
  };

  function mapFull(game: any) {
    const record = mapGame(game);
    const ratings: any[] = game.ratings || [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / count : 0;
    return {
      ...record,
      avgRating: Number(avg.toFixed(1)),
      ratingCount: count,
      isFavorited: false, // Injected later
      userRating: undefined, // Injected later
    };
  }

  // Random mode: fetch a larger pool, shuffle in-memory, return `limit` items
  if (options.sortBy === "random") {
    const limit = options.limit ?? 8;
    const total = await prisma.game.count({ where });
    if (total === 0) return [];

    const poolSize = Math.min(total, limit * 4);
    const maxSkip = Math.max(total - poolSize, 0);
    const skip = maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0;

    // Use popularity as base order so we don't pull unknown games from the very bottom
    const games = await prisma.game.findMany({
      where,
      orderBy: [{ popularityScore: "desc" }, { views: "desc" }],
      include,
      take: poolSize,
      skip,
    });

    return fisherYatesShuffle(games.map(mapFull)).slice(0, limit);
  }

  const orderBy: Prisma.GameOrderByWithRelationInput[] =
    options.sortBy === "popular"
      ? [
          { views: "desc" },
          { popularityScore: "desc" },
          { createdAt: "desc" },
        ]
      : [{ featured: "desc" }, { createdAt: "desc" }];

  const games = await prisma.game.findMany({
    where,
    orderBy,
    include,
    ...(options.limit ? { take: options.limit } : {}),
    ...(options.offset ? { skip: options.offset } : {}),
  });
  return games.map(mapFull);
}

async function injectUserData(games: GameRecord[], userId?: string): Promise<GameRecord[]> {
  if (!userId || games.length === 0) return games;

  const gameIds = games.map((g) => g.id);
  const [userFavs, userRatings] = await Promise.all([
    prisma.favoriteGame.findMany({
      where: { userId, gameId: { in: gameIds } },
      select: { gameId: true },
    }),
    (prisma as any).gameRating.findMany({
      where: { userId, gameId: { in: gameIds } },
      select: { gameId: true, value: true },
    }),
  ]);

  const fSet = new Set(userFavs.map((f: any) => f.gameId));
  const rMap = new Map(userRatings.map((r: any) => [r.gameId, r.value]));

  return games.map((g) => ({
    ...g,
    isFavorited: fSet.has(g.id),
    userRating: rMap.get(g.id),
  }));
}

export async function listGames(options: ListGamesOptions = {}) {
  // Extract user-specific info for post-hydration
  const currentUserId = options.currentUserId;
  const cacheableOptions = { ...options, currentUserId: undefined };
  let baseGames: GameRecord[];

  // Random cannot be fully cached static, but we can do it faster without joining favorites
  if (options.sortBy === "random") {
    baseGames = await _listGames(cacheableOptions);
  } else {
    const cacheKey = JSON.stringify(cacheableOptions);
    const cachedFn = unstable_cache(
      () => _listGames(cacheableOptions),
      ["games", "listGames", cacheKey],
      { revalidate: 3600 }
    );
    baseGames = await cachedFn();
  }

  return injectUserData(baseGames, currentUserId);
}

export async function listGamesPage(
  options: ListGamesOptions & {
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PaginatedGamesResult> {
  const requestedPage = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 12, 1), 48);
  const totalItems = await countGames(options);
  const pagination = buildPaginationMeta(totalItems, requestedPage, pageSize);

  const items = totalItems
    ? await listGames({
        ...options,
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
      })
    : [];

  return {
    items,
    pagination,
  };
}

async function _listCategories(options: { order?: CatalogCategoryOrderMode } = {}) {
  const categories = await prisma.game.findMany({
    where: { isPublished: true, category: { not: "" } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return sortCatalogCategories(
    categories.map((entry) => entry.category),
    {
      mode: options.order ?? "alphabetical",
    },
  );
}

export async function listCategories(options: { order?: CatalogCategoryOrderMode } = {}) {
  const cacheKey = JSON.stringify(options);
  const cachedFn = unstable_cache(
    () => _listCategories(options),
    ["games", "listCategories", cacheKey],
    { revalidate: 3600 }
  );
  return cachedFn();
}

async function listPublishedCategoryCounts() {
  const groupedCategories = await prisma.game.groupBy({
    by: ["category"],
    where: {
      isPublished: true,
      category: {
        not: "",
      },
    },
    _count: {
      _all: true,
    },
  });

  return groupedCategories
    .filter((entry) => entry.category)
    .map((entry) => ({
      category: entry.category,
      totalGames: entry._count._all,
    }));
}

async function _listCategoryShowcasesPage(
  options: {
    offset?: number;
    limit?: number;
    gamesPerCategory?: number;
    sortBy?: "newest" | "popular" | "random";
    categoryOrder?: CatalogCategoryOrderMode;
    currentUserId?: string;
  } = {},
): Promise<PaginatedCategoryShowcasesResult> {
  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 8, 1), 16);
  const gamesPerCategory = Math.min(Math.max(options.gamesPerCategory ?? 8, 1), 18);
  const categoryCounts = await listPublishedCategoryCounts();
  const countMap = new Map(categoryCounts.map((entry) => [entry.category, entry.totalGames]));

  const orderedCategories = sortCatalogCategories(
    categoryCounts.map((entry) => entry.category),
    {
      mode: options.categoryOrder ?? "editorial",
      counts: countMap,
    },
  );

  const selectedCategories = orderedCategories.slice(offset, offset + limit);

  // Single batched query instead of N separate queries (one per category)
  const sortBy = options.sortBy ?? "popular";
  const orderBy: Prisma.GameOrderByWithRelationInput[] =
    sortBy === "newest"
      ? [{ createdAt: "desc" }]
      : [{ views: "desc" }, { popularityScore: "desc" }, { createdAt: "desc" }];

  const include: any = {
    ratings: { select: { value: true } },
  };

  const allGames = await prisma.game.findMany({
    where: {
      isPublished: true,
      category: { in: selectedCategories },
    },
    orderBy,
    include,
  });

  // Partition by category in JS
  const gamesByCategory = new Map<string, typeof allGames>();
  for (const game of allGames) {
    let list = gamesByCategory.get(game.category);
    if (!list) {
      list = [];
      gamesByCategory.set(game.category, list);
    }
    list.push(game);
  }

  function mapBatchedGame(game: any): GameRecord {
    const record = mapGame(game);
    const ratings: any[] = game.ratings || [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / count : 0;
    return {
      ...record,
      avgRating: Number(avg.toFixed(1)),
      ratingCount: count,
      isFavorited: false, // Injected later
    };
  }

  const items = selectedCategories.map((category) => {
    let categoryGames = gamesByCategory.get(category) ?? [];
    if (sortBy === "random") {
      categoryGames = fisherYatesShuffle(categoryGames);
    }
    return {
      category,
      totalGames: countMap.get(category) ?? 0,
      games: categoryGames.slice(0, gamesPerCategory).map(mapBatchedGame),
    };
  });

  const visibleItems = items.filter((entry) => entry.games.length > 0);
  const nextOffset = offset + selectedCategories.length;

  return {
    items: visibleItems,
    offset,
    limit,
    totalCategories: orderedCategories.length,
    hasMore: nextOffset < orderedCategories.length,
    nextOffset: nextOffset < orderedCategories.length ? nextOffset : null,
  };
}

export async function listCategoryShowcasesPage(
  options: {
    offset?: number;
    limit?: number;
    gamesPerCategory?: number;
    sortBy?: "newest" | "popular" | "random";
    categoryOrder?: CatalogCategoryOrderMode;
    currentUserId?: string;
  } = {},
): Promise<PaginatedCategoryShowcasesResult> {
  const currentUserId = options.currentUserId;
  const cacheableOptions = { ...options, currentUserId: undefined };
  let baseShowcases: PaginatedCategoryShowcasesResult;

  if (options.sortBy === "random") {
    baseShowcases = await _listCategoryShowcasesPage(cacheableOptions);
  } else {
    const cacheKey = JSON.stringify(cacheableOptions);
    const cachedFn = unstable_cache(
      () => _listCategoryShowcasesPage(cacheableOptions),
      ["games", "listCategoryShowcasesPage", cacheKey],
      { revalidate: 3600 }
    );
    baseShowcases = await cachedFn();
  }

  // Se precisar de user id, extraímos todas as IDs de jogos contidas e fazemos apenas 1 chamada no DB
  if (currentUserId && baseShowcases.items.length > 0) {
    const allGameIds = baseShowcases.items.flatMap(c => c.games.map(g => g.id));
    const [userFavs, userRatings] = await Promise.all([
      prisma.favoriteGame.findMany({
        where: { userId: currentUserId, gameId: { in: allGameIds } },
        select: { gameId: true },
      }),
      (prisma as any).gameRating.findMany({
        where: { userId: currentUserId, gameId: { in: allGameIds } },
        select: { gameId: true, value: true },
      }),
    ]);

    const fSet = new Set(userFavs.map((f: any) => f.gameId));
    const rMap = new Map(userRatings.map((r: any) => [r.gameId, r.value]));

    baseShowcases.items = baseShowcases.items.map(category => ({
      ...category,
      games: category.games.map(g => ({
        ...g,
        isFavorited: fSet.has(g.id),
        userRating: rMap.get(g.id),
      }))
    }));
  }

  return baseShowcases;
}

export async function listCategoryShowcases(
  options: {
    limit?: number;
    gamesPerCategory?: number;
    sortBy?: "newest" | "popular";
    categoryOrder?: CatalogCategoryOrderMode;
  } = {},
): Promise<CategoryShowcaseRecord[]> {
  const result = await listCategoryShowcasesPage(options);
  return result.items;
}

export async function getGameById(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  return game ? mapGame(game) : null;
}

async function _getGameBySlug(slug: string, publishedOnly = false) {
  const game = await prisma.game.findUnique({ where: { slug } });

  if (!game) {
    return null;
  }

  if (publishedOnly && !game.isPublished) {
    return null;
  }

  return mapGame(game);
}

export async function getGameBySlug(slug: string, publishedOnly = false) {
  const cachedFn = unstable_cache(
    () => _getGameBySlug(slug, publishedOnly),
    ["games", "getGameBySlug", slug, publishedOnly ? "pub" : "all"],
    { revalidate: 3600 }
  );
  return cachedFn();
}

export async function listRelatedGames(game: Pick<GameRecord, "category" | "slug" | "tags">, limit = 4) {
  // Pre-calculate tag filters for the query
  const tagFilters = (game.tags || []).map((tag) => ({
    tags: { contains: tag },
  }));

  // Match: Same category OR share at least one tag
  const candidates = await prisma.game.findMany({
    where: {
      isPublished: true,
      slug: { not: game.slug },
      OR: [{ category: game.category }, ...tagFilters],
    },
    include: {
      ratings: { select: { value: true } },
    } as any,
    take: 32, // Large pool to rank and pick from
  });

  const mapWithRatings = (g: any): GameRecord => {
    const record = mapGame(g);
    const ratings = g.ratings || [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / count : 0;
    return { ...record, avgRating: Number(avg.toFixed(1)), ratingCount: count };
  };

  // Rank by similarity and popularity in JS
  const ranked = candidates.map((c) => {
    const cTags = normalizeTags(c.tags);
    const commonTags = (game.tags || []).filter((t) => cTags.includes(t)).length;
    const sameCategory = c.category === game.category ? 1 : 0;

    // SCORING: Tags weight 2x, Category weight 1x
    // We add a tiny random factor (0 to 0.5) to keep the list fresh
    const similarityScore = commonTags * 2 + sameCategory + Math.random() * 0.5;

    return {
      game: mapWithRatings(c),
      similarityScore,
      popularity: c.popularityScore + c.views / 200,
    };
  });

  // Sort: Similarity first, then popularity
  ranked.sort((a, b) => {
    if (Math.floor(b.similarityScore) !== Math.floor(a.similarityScore)) {
      return b.similarityScore - a.similarityScore;
    }
    return b.popularity - a.popularity;
  });

  let finalGames = ranked.slice(0, limit).map((r) => r.game);

  // Global fallback if even with tags/category we don't have enough (rare)
  if (finalGames.length < limit) {
    const fallback = await prisma.game.findMany({
      where: {
        isPublished: true,
        slug: {
          notIn: [game.slug, ...finalGames.map((entry) => entry.slug)],
        },
      },
      orderBy: [{ featured: "desc" }, { popularityScore: "desc" }, { views: "desc" }],
      include: {
        ratings: { select: { value: true } },
      } as any,
      take: limit - finalGames.length,
    });

    finalGames = [...finalGames, ...fallback.map(mapWithRatings)];
  }

  return finalGames;
}

export async function createGame(data: CreateGameInput) {
  const slug = await makeUniqueSlug(data.title);
  const game = await prisma.game.create({
    data: {
      title: data.title,
      slug,
      iframeUrl: data.iframeUrl,
      thumbnail: data.thumbnail,
      description: data.description,
      category: data.category,
      tags: serializeTags(data.tags ?? []),
      featured: data.featured,
      isPublished: data.isPublished,
      popularityScore: data.featured ? 10 : 0,
      longDescription: (data as any).longDescription ?? "",
      tips: (data as any).tips ?? "",
      controls: (data as any).controls ?? "",
      faqJson: (data as any).faqJson ?? "",
    },
  });

  return mapGame(game);
}

export async function updateGame(id: string, data: UpdateGameInput) {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) return null;

  const game = await prisma.game.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.iframeUrl !== undefined ? { iframeUrl: data.iframeUrl } : {}),
      ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.tags !== undefined ? { tags: serializeTags(data.tags) } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      ...(data.title && data.title !== existing.title ? { slug: await makeUniqueSlug(data.title) } : {}),
    },
  });

  return mapGame(game);
}

export async function deleteGame(id: string) {
  try {
    const game = await prisma.game.delete({ where: { id } });
    return mapGame(game);
  } catch {
    return null;
  }
}

export async function incrementGameViews(slug: string) {
  try {
    const game = await prisma.game.update({
      where: { slug },
      data: {
        views: { increment: 1 },
        popularityScore: { increment: 1 },
      },
    });

    return mapGame(game);
  } catch {
    return null;
  }
}

export async function countGames(
  options: Pick<
    ListGamesOptions,
    "category" | "featured" | "published" | "publishedOnly" | "query"
  > = {},
) {
  const where: Prisma.GameWhereInput = {
    ...(typeof options.published === "boolean"
      ? { isPublished: options.published }
      : options.publishedOnly
      ? { isPublished: true }
      : {}),
    ...(options.featured !== undefined ? { featured: options.featured } : {}),
    ...(options.category && options.category !== "all"
      ? { category: options.category }
      : {}),
    ...(options.query
      ? {
          OR: [
            { title: { contains: options.query } },
            { category: { contains: options.query } },
            { tags: { contains: options.query } },
          ],
        }
      : {}),
  };

  const cacheKey = JSON.stringify(where);
  const cachedFn = unstable_cache(
    () => prisma.game.count({ where }),
    ["games", "countGames", cacheKey],
    { revalidate: 3600 }
  );

  return cachedFn();
}

export async function rateGame(userId: string, gameId: string, value: number) {
  if (value < 1 || value > 5) throw new Error("O valor deve estar entre 1 e 5 estrelas.");

  const rating = await (prisma as any).gameRating.upsert({
    where: {
      userId_gameId: { userId, gameId },
    },
    update: { value },
    create: { userId, gameId, value },
  });

  return rating;
}

export async function getGameRatingStats(gameId: string) {
  const result = await prisma.gameRating.aggregate({
    where: { gameId },
    _avg: { value: true },
    _count: { value: true },
  });
  return {
    avgRating: Number((result._avg.value ?? 0).toFixed(1)),
    ratingCount: result._count.value,
  };
}

export async function getUserGameRating(userId: string, gameId: string) {
  return (prisma as any).gameRating.findUnique({
    where: {
      userId_gameId: { userId, gameId },
    },
    select: { value: true },
  });
}
