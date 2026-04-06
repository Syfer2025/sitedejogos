import type { Game } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { DEFAULT_GAMES } from "@/data/defaultGames";
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
};

type ListGamesOptions = {
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  published?: boolean;
  publishedOnly?: boolean;
  query?: string;
  sortBy?: "newest" | "popular";
};

export type PaginatedGamesResult = {
  items: GameRecord[];
  pagination: ReturnType<typeof buildPaginationMeta>;
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
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
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

export async function listGames(options: ListGamesOptions = {}) {
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
    ...(options.limit ? { take: options.limit } : {}),
    ...(options.offset ? { skip: options.offset } : {}),
  });

  return games.map(mapGame);
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

export async function listCategories() {
  const categories = await prisma.game.findMany({
    where: { isPublished: true, category: { not: "" } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return categories.map((entry) => entry.category);
}

export async function getGameById(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  return game ? mapGame(game) : null;
}

export async function getGameBySlug(slug: string, publishedOnly = false) {
  const game = await prisma.game.findUnique({ where: { slug } });

  if (!game) {
    return null;
  }

  if (publishedOnly && !game.isPublished) {
    return null;
  }

  return mapGame(game);
}

export async function listRelatedGames(game: Pick<GameRecord, "category" | "slug">, limit = 4) {
  const sameCategory = await prisma.game.findMany({
    where: {
      isPublished: true,
      slug: { not: game.slug },
      ...(game.category ? { category: game.category } : {}),
    },
    orderBy: [{ featured: "desc" }, { popularityScore: "desc" }, { views: "desc" }],
    take: limit,
  });

  if (sameCategory.length >= limit) {
    return sameCategory.map(mapGame);
  }

  const fallback = await prisma.game.findMany({
    where: {
      isPublished: true,
      slug: {
        notIn: [game.slug, ...sameCategory.map((entry) => entry.slug)],
      },
    },
    orderBy: [{ featured: "desc" }, { popularityScore: "desc" }, { views: "desc" }],
    take: limit - sameCategory.length,
  });

  return [...sameCategory, ...fallback].map(mapGame);
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

  return prisma.game.count({ where });
}
