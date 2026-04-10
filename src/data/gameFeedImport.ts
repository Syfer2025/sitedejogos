import type { Game } from "@prisma/client";

import { createGameInputSchema, slugify, type CreateGameInput } from "../lib/game-schema";
import {
  GAMEMONETIZE_SOURCE,
  fetchGameMonetizeFeedPage,
  mapGameMonetizeFeedItem,
} from "../lib/gamemonetize-feed";
import { buildGameContent } from "../lib/content-templates";
import { prisma } from "../lib/prisma";

type ExistingGame = Pick<
  Game,
  | "id"
  | "title"
  | "slug"
  | "iframeUrl"
  | "thumbnail"
  | "description"
  | "category"
  | "tags"
  | "featured"
  | "isPublished"
  | "externalSource"
  | "externalId"
>;

type GameIndex = {
  byExternalId: Map<string, ExistingGame>;
  byIframeUrl: Map<string, ExistingGame>;
  byTitle: Map<string, ExistingGame>;
};

export type FeedSyncItemResult = {
  sourceId: string;
  title: string;
  status: "created" | "updated" | "skipped";
  id?: string;
  reason?: string;
};

export type FeedSyncResult = {
  source: typeof GAMEMONETIZE_SOURCE;
  page: number;
  totalFetched: number;
  totalPrepared: number;
  created: number;
  updated: number;
  skipped: number;
  items: FeedSyncItemResult[];
};

export type FeedSyncPageSummary = Pick<
  FeedSyncResult,
  "page" | "totalFetched" | "totalPrepared" | "created" | "updated" | "skipped"
>;

export type FeedBatchSyncResult = {
  source: typeof GAMEMONETIZE_SOURCE;
  startPage: number;
  pageCount: number;
  totalFetched: number;
  totalPrepared: number;
  created: number;
  updated: number;
  skipped: number;
  results: FeedSyncPageSummary[];
};

type SyncOptions = {
  page?: number;
  maxItems?: number;
};

type BatchSyncOptions = SyncOptions & {
  pages?: number;
};

function serializeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(",");
}

function titleKey(value: string) {
  return value.trim().toLowerCase();
}

function unregisterGame(index: GameIndex, game: ExistingGame) {
  const externalId = game.externalSource === GAMEMONETIZE_SOURCE ? game.externalId : null;

  if (externalId && index.byExternalId.get(externalId)?.id === game.id) {
    index.byExternalId.delete(externalId);
  }

  if (index.byIframeUrl.get(game.iframeUrl)?.id === game.id) {
    index.byIframeUrl.delete(game.iframeUrl);
  }

  const lookupTitle = titleKey(game.title);

  if (index.byTitle.get(lookupTitle)?.id === game.id) {
    index.byTitle.delete(lookupTitle);
  }
}

function registerGame(index: GameIndex, game: ExistingGame) {
  const externalId = game.externalSource === GAMEMONETIZE_SOURCE ? game.externalId : null;

  if (externalId) {
    index.byExternalId.set(externalId, game);
  }

  index.byIframeUrl.set(game.iframeUrl, game);
  index.byTitle.set(titleKey(game.title), game);
}

async function makeUniqueSlug(title: string, ignoreGameId?: string) {
  const baseSlug = slugify(title);
  let nextSlug = baseSlug;
  let counter = 1;

  while (
    await prisma.game.findFirst({
      where: {
        slug: nextSlug,
        ...(ignoreGameId ? { id: { not: ignoreGameId } } : {}),
      },
      select: { id: true },
    })
  ) {
    nextSlug = `${baseSlug}-${counter++}`;
  }

  return nextSlug;
}

function needsUpdate(existing: ExistingGame, payload: CreateGameInput, sourceId: string) {
  return (
    existing.title !== payload.title ||
    existing.iframeUrl !== payload.iframeUrl ||
    existing.thumbnail !== payload.thumbnail ||
    existing.description !== payload.description ||
    existing.category !== payload.category ||
    existing.tags !== serializeTags(payload.tags) ||
    existing.isPublished !== payload.isPublished ||
    existing.externalSource !== GAMEMONETIZE_SOURCE ||
    existing.externalId !== sourceId ||
    (!existing.featured && payload.featured)
  );
}

async function createImportedGame(payload: CreateGameInput, sourceId: string) {
  const slug = await makeUniqueSlug(payload.title);

  const game = await prisma.game.create({
    data: {
      title: payload.title,
      slug,
      iframeUrl: payload.iframeUrl,
      thumbnail: payload.thumbnail,
      description: payload.description,
      category: payload.category,
      tags: serializeTags(payload.tags),
      featured: payload.featured,
      isPublished: payload.isPublished,
      externalSource: GAMEMONETIZE_SOURCE,
      externalId: sourceId,
      popularityScore: payload.featured ? 10 : 0,
    },
  });

  // Generate SEO content immediately using local templates (zero cost, instant)
  const content = buildGameContent({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    tags: serializeTags(payload.tags),
  });

  return prisma.game.update({
    where: { id: game.id },
    data: {
      longDescription: content.longDescription,
      tips: content.tips,
      controls: content.controls,
      faqJson: content.faqJson,
    },
  });
}

async function updateImportedGame(existing: ExistingGame, payload: CreateGameInput, sourceId: string) {
  const nextSlug =
    payload.title !== existing.title
      ? await makeUniqueSlug(payload.title, existing.id)
      : existing.slug;

  return prisma.game.update({
    where: { id: existing.id },
    data: {
      title: payload.title,
      slug: nextSlug,
      iframeUrl: payload.iframeUrl,
      thumbnail: payload.thumbnail,
      description: payload.description,
      category: payload.category,
      tags: serializeTags(payload.tags),
      featured: existing.featured || payload.featured,
      isPublished: payload.isPublished,
      externalSource: GAMEMONETIZE_SOURCE,
      externalId: sourceId,
    },
  });
}

function summarizeFeedSyncResult(result: FeedSyncResult): FeedSyncPageSummary {
  return {
    page: result.page,
    totalFetched: result.totalFetched,
    totalPrepared: result.totalPrepared,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
  };
}

export async function syncGameMonetizeFeedPages(
  options: BatchSyncOptions = {},
): Promise<FeedBatchSyncResult> {
  const startPage = Math.max(options.page ?? 1, 1);
  const pageCount = Math.min(Math.max(options.pages ?? 1, 1), 10);
  const results: FeedSyncPageSummary[] = [];

  let totalFetched = 0;
  let totalPrepared = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let pageOffset = 0; pageOffset < pageCount; pageOffset += 1) {
    // Pausa entre páginas para evitar 429 (Too Many Requests)
    if (pageOffset > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const result = await syncGameMonetizeFeedPage({
      ...options,
      page: startPage + pageOffset,
    });

    totalFetched += result.totalFetched;
    totalPrepared += result.totalPrepared;
    created += result.created;
    updated += result.updated;
    skipped += result.skipped;
    results.push(summarizeFeedSyncResult(result));
  }

  return {
    source: GAMEMONETIZE_SOURCE,
    startPage,
    pageCount,
    totalFetched,
    totalPrepared,
    created,
    updated,
    skipped,
    results,
  };
}

export async function syncGameMonetizeFeedPage(options: SyncOptions = {}): Promise<FeedSyncResult> {
  const page = Math.max(options.page ?? 1, 1);
  const fetchedItems = await fetchGameMonetizeFeedPage(page);
  const targetItems =
    typeof options.maxItems === "number" && options.maxItems > 0
      ? fetchedItems.slice(0, options.maxItems)
      : fetchedItems;

  const existingGames = await prisma.game.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      iframeUrl: true,
      thumbnail: true,
      description: true,
      category: true,
      tags: true,
      featured: true,
      isPublished: true,
      externalSource: true,
      externalId: true,
    },
  });

  const index: GameIndex = {
    byExternalId: new Map<string, ExistingGame>(),
    byIframeUrl: new Map<string, ExistingGame>(),
    byTitle: new Map<string, ExistingGame>(),
  };

  for (const game of existingGames) {
    registerGame(index, game);
  }

  const seenSourceIds = new Set<string>();

  const result: FeedSyncResult = {
    source: GAMEMONETIZE_SOURCE,
    page,
    totalFetched: targetItems.length,
    totalPrepared: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    items: [],
  };

  for (const item of targetItems) {
    const sourceId = String(item.id ?? "").trim();
    const fallbackTitle = typeof item.title === "string" ? item.title.trim() : "Sem título";

    if (!sourceId) {
      result.skipped += 1;
      result.items.push({
        sourceId: "",
        title: fallbackTitle,
        status: "skipped",
        reason: "Item sem identificador externo.",
      });
      continue;
    }

    if (seenSourceIds.has(sourceId)) {
      result.skipped += 1;
      result.items.push({
        sourceId,
        title: fallbackTitle,
        status: "skipped",
        reason: "Item duplicado dentro do feed.",
      });
      continue;
    }

    seenSourceIds.add(sourceId);

    const mappedItem = mapGameMonetizeFeedItem(item);

    if (!mappedItem) {
      result.skipped += 1;
      result.items.push({
        sourceId,
        title: fallbackTitle,
        status: "skipped",
        reason: "Campos obrigatórios ausentes ou inválidos.",
      });
      continue;
    }

    const parsedPayload = createGameInputSchema.safeParse(mappedItem);

    if (!parsedPayload.success) {
      result.skipped += 1;
      result.items.push({
        sourceId,
        title: mappedItem.title,
        status: "skipped",
        reason: parsedPayload.error.issues[0]?.message ?? "Payload inválido.",
      });
      continue;
    }

    // Filtro de Qualidade: Descrição rica e tags mínimas
    if (mappedItem.description.length < 200 || mappedItem.tags.length < 3) {
      result.skipped += 1;
      result.items.push({
        sourceId,
        title: mappedItem.title,
        status: "skipped",
        reason: `Metadados insuficientes (Desc: ${mappedItem.description.length}, Tags: ${mappedItem.tags.length})`,
      });
      continue;
    }

    result.totalPrepared += 1;

    const payload = parsedPayload.data;
    const existingGame =
      index.byExternalId.get(sourceId) ??
      index.byIframeUrl.get(payload.iframeUrl) ??
      index.byTitle.get(titleKey(payload.title));

    if (!existingGame) {
      const createdGame = await createImportedGame(payload, sourceId);

      registerGame(index, createdGame);
      result.created += 1;
      result.items.push({
        sourceId,
        title: createdGame.title,
        status: "created",
        id: createdGame.id,
      });
      continue;
    }

    if (!needsUpdate(existingGame, payload, sourceId)) {
      result.skipped += 1;
      result.items.push({
        sourceId,
        title: existingGame.title,
        status: "skipped",
        id: existingGame.id,
        reason: "Sem alterações para aplicar.",
      });
      continue;
    }

    const updatedGame = await updateImportedGame(existingGame, payload, sourceId);

    unregisterGame(index, existingGame);
    registerGame(index, updatedGame);
    result.updated += 1;
    result.items.push({
      sourceId,
      title: updatedGame.title,
      status: "updated",
      id: updatedGame.id,
    });
  }

  return result;
}