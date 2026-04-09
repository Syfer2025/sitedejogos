import { prisma } from "@/lib/prisma";
import { summarizeAnalyticsEvents, type AnalyticsEventType } from "@/lib/analytics";

export async function recordAnalyticsEvent(input: {
  type: AnalyticsEventType;
  path: string;
  destinationPath?: string;
  sessionId?: string;
  userId?: string;
  gameId?: string;
  referrer?: string;
}) {
  await prisma.analyticsEvent.create({
    data: {
      type: input.type,
      path: input.path,
      destinationPath: input.destinationPath,
      sessionId: input.sessionId,
      userId: input.userId,
      gameId: input.gameId,
      referrer: input.referrer,
    },
  });
}

export async function getAnalyticsOverview(windowDays = 14) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [events, registeredPlayers, publishedGames, favoriteEntries, recentPlayEntries, topCatalogGames] =
    await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.game.count({
        where: {
          isPublished: true,
        },
      }),
      prisma.favoriteGame.count(),
      prisma.recentlyPlayed.count(),
      prisma.game.findMany({
        where: {
          isPublished: true,
        },
        orderBy: [{ views: "desc" }, { popularityScore: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          views: true,
        },
      }),
    ]);

  const summary = summarizeAnalyticsEvents(
    events.map((event) => ({
      type: event.type as AnalyticsEventType,
      path: event.path,
      destinationPath: event.destinationPath,
      sessionId: event.sessionId,
      referrer: event.referrer,
      createdAt: event.createdAt,
      gameId: event.gameId,
      gameTitle: event.game?.title,
      gameSlug: event.game?.slug,
    })),
    windowDays,
  );

  return {
    windowDays,
    summary,
    lifetime: {
      registeredPlayers,
      publishedGames,
      favoriteEntries,
      recentPlayEntries,
    },
    topCatalogGames,
  };
}

/**
 * For each blog slug, find the earliest analytics event (impression, click, or view)
 * and return a map of slug → firstEventAt.
 */
export async function getBlogFirstTractionMap(
  slugs: string[],
): Promise<Record<string, Date>> {
  if (slugs.length === 0) {
    return {};
  }

  const blogPaths = slugs.map((slug) => `/blog/${slug}`);
  const blogTypes = ["blog_impression", "blog_click", "blog_view"];

  const events = await prisma.analyticsEvent.findMany({
    where: {
      type: { in: blogTypes },
      OR: [
        { path: { in: blogPaths } },
        { destinationPath: { in: blogPaths } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      path: true,
      destinationPath: true,
      type: true,
      createdAt: true,
    },
  });

  const result: Record<string, Date> = {};

  for (const event of events) {
    // Extract slug from path or destinationPath
    const targetPath =
      event.type === "blog_view" ? event.path : event.destinationPath;
    if (!targetPath) continue;
    const match = targetPath.match(/^\/blog\/(.+)$/);
    if (!match) continue;
    const slug = match[1];

    if (!result[slug]) {
      result[slug] = event.createdAt; // First event because sorted by createdAt asc
    }
  }

  return result;
}