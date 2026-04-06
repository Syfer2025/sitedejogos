import { z } from "zod";

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "home_click",
  "blog_impression",
  "blog_click",
  "blog_view",
  "game_view",
  "favorite_add",
  "player_login",
  "player_register",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const HOME_FUNNEL_BLOCKS = [
  { key: "hero", label: "Hero" },
  { key: "categories", label: "Categorias" },
  { key: "recommended", label: "Recomendações" },
  { key: "blog", label: "Blog" },
  { key: "continue", label: "Continue jogando" },
  { key: "featured", label: "Destaques" },
  { key: "new", label: "Lançamentos" },
  { key: "popular", label: "Mais jogados" },
  { key: "cta", label: "CTAs" },
  { key: "mission", label: "Missão" },
  { key: "other", label: "Outros" },
] as const;

export type HomeFunnelBlockKey = (typeof HOME_FUNNEL_BLOCKS)[number]["key"];

export const HOME_CONVERSION_ATTRIBUTION_WINDOW_MS = 30 * 60 * 1000;

export const publicAnalyticsEventSchema = z.union([
  z.object({
    type: z.literal("page_view"),
    path: z.string().trim().min(1).max(240),
    sessionId: z.string().trim().min(8).max(80),
    referrer: z.string().trim().max(240).optional(),
  }),
  z.object({
    type: z.literal("home_click"),
    path: z.string().trim().min(1).max(240),
    destinationPath: z.string().trim().min(1).max(240).optional(),
    sessionId: z.string().trim().min(8).max(80),
    referrer: z.string().trim().max(240).optional(),
  }),
  z.object({
    type: z.literal("blog_impression"),
    path: z.string().trim().min(1).max(240),
    destinationPath: z.string().trim().min(1).max(240),
    sessionId: z.string().trim().min(8).max(80),
    referrer: z.string().trim().max(240).optional(),
  }),
  z.object({
    type: z.literal("blog_click"),
    path: z.string().trim().min(1).max(240),
    destinationPath: z.string().trim().min(1).max(240),
    sessionId: z.string().trim().min(8).max(80),
    referrer: z.string().trim().max(240).optional(),
  }),
  z.object({
    type: z.literal("blog_view"),
    path: z.string().trim().min(1).max(240),
    sessionId: z.string().trim().min(8).max(80),
    referrer: z.string().trim().max(240).optional(),
  }),
]);

export type PublicAnalyticsEvent = z.infer<typeof publicAnalyticsEventSchema>;

export type AnalyticsSourceEvent = {
  type: AnalyticsEventType;
  path: string;
  destinationPath?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  createdAt: Date;
  gameId?: string | null;
  gameTitle?: string | null;
  gameSlug?: string | null;
};

export type AnalyticsSummary = {
  totals: {
    pageViews: number;
    homeClicks: number;
    blogImpressions: number;
    blogClicks: number;
    blogViews: number;
    blogCtr: number;
    gameViews: number;
    favoritesAdded: number;
    playerLogins: number;
    playerRegistrations: number;
    uniqueSessions: number;
  };
  timeline: Array<{
    date: string;
    pageViews: number;
    homeClicks: number;
    blogImpressions: number;
    blogClicks: number;
    blogViews: number;
    gameViews: number;
    favoritesAdded: number;
    playerLogins: number;
    playerRegistrations: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  topHomeInteractions: Array<{
    path: string;
    clicks: number;
  }>;
  homeFunnel: {
    homeViews: number;
    blocks: Array<{
      block: HomeFunnelBlockKey;
      label: string;
      clicks: number;
      uniqueSessions: number;
      playSessions: number;
      favoriteSessions: number;
      loginSessions: number;
      registerSessions: number;
      acquisitionSessions: number;
      firstAcquisitionSessions: number;
      assistedAcquisitionSessions: number;
      actionSessions: number;
      conversionRate: number;
      playConversionRate: number;
      favoriteConversionRate: number;
      loginConversionRate: number;
      registerConversionRate: number;
      acquisitionConversionRate: number;
      firstAcquisitionRate: number;
      assistedAcquisitionRate: number;
      actionConversionRate: number;
      shareOfHomeClicks: number;
    }>;
  };
  topGames: Array<{
    gameId: string;
    title: string;
    slug: string;
    views: number;
  }>;
  blogPerformance: {
    impressions: number;
    clicks: number;
    views: number;
    ctr: number;
    topSources: Array<{
      path: string;
      impressions: number;
      clicks: number;
      views: number;
      ctr: number;
      clickToViewRate: number;
    }>;
    posts: Array<{
      slug: string;
      path: string;
      impressions: number;
      clicks: number;
      views: number;
      ctr: number;
      clickToViewRate: number;
      topSource: string | null;
      sources: Array<{
        path: string;
        impressions: number;
        clicks: number;
        views: number;
        ctr: number;
        clickToViewRate: number;
      }>;
    }>;
  };
};

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getHomeClickBlock(path: string): HomeFunnelBlockKey {
  if (path.startsWith("/home/hero/")) {
    return "hero";
  }

  if (path.startsWith("/home/category/")) {
    return "categories";
  }

  if (
    path.startsWith("/home/section/recommended/") ||
    path.startsWith("/home/section-header/recommended")
  ) {
    return "recommended";
  }

  if (path.startsWith("/home/blog/")) {
    return "blog";
  }

  if (
    path.startsWith("/home/section/continue/") ||
    path.startsWith("/home/section-header/continue")
  ) {
    return "continue";
  }

  if (
    path.startsWith("/home/section/featured/") ||
    path.startsWith("/home/section-header/featured")
  ) {
    return "featured";
  }

  if (
    path.startsWith("/home/section/new/") ||
    path.startsWith("/home/section-header/new")
  ) {
    return "new";
  }

  if (
    path.startsWith("/home/section/popular/") ||
    path.startsWith("/home/section-header/popular")
  ) {
    return "popular";
  }

  if (path.startsWith("/home/cta/")) {
    return "cta";
  }

  if (path.startsWith("/home/mission/") || path.startsWith("/home/guest/")) {
    return "mission";
  }

  return "other";
}

function normalizeAnalyticsPath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}` || "/";
    } catch {
      return null;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getLastPathSegment(path: string) {
  const normalizedPath = normalizeAnalyticsPath(path);

  if (!normalizedPath) {
    return null;
  }

  const [pathname] = normalizedPath.split("?");
  const segments = pathname.split("/").filter(Boolean);

  return segments.at(-1) ?? null;
}

function extractGameSlugFromPath(path: string | null | undefined) {
  const normalizedPath = normalizeAnalyticsPath(path);

  if (!normalizedPath?.startsWith("/games/")) {
    return null;
  }

  return getLastPathSegment(normalizedPath);
}

function extractBlogSlugFromPath(path: string | null | undefined) {
  const normalizedPath = normalizeAnalyticsPath(path);

  if (!normalizedPath?.startsWith("/blog/")) {
    return null;
  }

  return getLastPathSegment(normalizedPath);
}

function extractTrackedGameSlug(path: string) {
  const normalizedPath = normalizeAnalyticsPath(path);

  if (!normalizedPath) {
    return null;
  }

  const heroMatch = normalizedPath.match(/^\/home\/hero\/(?:cover\/)?[^/]+\/([^/?#]+)$/);
  if (heroMatch?.[1]) {
    return heroMatch[1];
  }

  const sectionMatch = normalizedPath.match(/^\/home\/section\/[^/]+\/([^/?#]+)$/);
  if (sectionMatch?.[1]) {
    return sectionMatch[1];
  }

  return null;
}

function getHomeClickDestination(path: string) {
  const normalizedPath = normalizeAnalyticsPath(path);

  if (!normalizedPath) {
    return null;
  }

  if (normalizedPath === "/home/blog/index") {
    return "/blog";
  }

  if (normalizedPath.startsWith("/home/blog/")) {
    const slug = getLastPathSegment(normalizedPath);
    return slug ? `/blog/${slug}` : null;
  }

  if (normalizedPath.startsWith("/home/category/")) {
    const slug = getLastPathSegment(normalizedPath);
    return slug ? `/category/${slug}` : null;
  }

  const trackedGameSlug = extractTrackedGameSlug(normalizedPath);
  if (trackedGameSlug) {
    return `/games/${trackedGameSlug}`;
  }

  if (normalizedPath === "/home/cta/register" || normalizedPath === "/home/guest/action") {
    return "/login?mode=register";
  }

  if (normalizedPath === "/home/cta/mission" || normalizedPath === "/home/mission/action") {
    return "/account";
  }

  if (
    normalizedPath === "/home/section-header/continue" ||
    normalizedPath === "/home/section-header/recommended"
  ) {
    return "/account";
  }

  if (
    normalizedPath === "/home/section-header/featured" ||
    normalizedPath === "/home/section-header/new" ||
    normalizedPath === "/home/section-header/popular"
  ) {
    return "/games";
  }

  return null;
}

function resolveHomeClickDestination(path: string, destinationPath?: string | null) {
  const normalizedDestinationPath = normalizeAnalyticsPath(destinationPath);

  if (normalizedDestinationPath) {
    return normalizedDestinationPath;
  }

  return getHomeClickDestination(path);
}

function isHomeReferrer(path: string | null) {
  return path === "/" || path?.startsWith("/?") || false;
}

type HomeClickAttributionCandidate = {
  block: HomeFunnelBlockKey;
  path: string;
  destinationPath?: string | null;
  clickedAt: number;
};

function getRecentHomeClickCandidates(
  store: Map<string, HomeClickAttributionCandidate[]>,
  sessionId: string,
  eventTimestamp: number,
) {
  const current = store.get(sessionId) ?? [];
  const recent = current.filter(
    (entry) =>
      entry.clickedAt <= eventTimestamp &&
      eventTimestamp - entry.clickedAt <= HOME_CONVERSION_ATTRIBUTION_WINDOW_MS,
  );

  if (recent.length > 0) {
    store.set(sessionId, recent);
  } else {
    store.delete(sessionId);
  }

  return recent;
}

function resolveHomeAttribution(
  candidates: HomeClickAttributionCandidate[],
  event: AnalyticsSourceEvent,
) {
  if (candidates.length === 0) {
    return null;
  }

  const reverseCandidates = [...candidates].reverse();
  const normalizedEventPath = normalizeAnalyticsPath(event.path);
  const normalizedEventReferrer = normalizeAnalyticsPath(event.referrer);

  if (normalizedEventReferrer) {
    const byReferrerDestination = reverseCandidates.find(
      (candidate) =>
        resolveHomeClickDestination(candidate.path, candidate.destinationPath) ===
        normalizedEventReferrer,
    );

    if (byReferrerDestination) {
      return byReferrerDestination;
    }
  }

  const matchingGameSlug =
    extractGameSlugFromPath(normalizedEventPath) ??
    extractGameSlugFromPath(normalizedEventReferrer);

  if (matchingGameSlug) {
    const byTrackedSlug = reverseCandidates.find(
      (candidate) => extractTrackedGameSlug(candidate.path) === matchingGameSlug,
    );

    if (byTrackedSlug) {
      return byTrackedSlug;
    }
  }

  if (normalizedEventPath) {
    const byEventDestination = reverseCandidates.find(
      (candidate) =>
        resolveHomeClickDestination(candidate.path, candidate.destinationPath) ===
        normalizedEventPath,
    );

    if (byEventDestination) {
      return byEventDestination;
    }
  }

  if (
    (event.type === "player_login" || event.type === "player_register") &&
    isHomeReferrer(normalizedEventReferrer)
  ) {
    const authLandingClick = reverseCandidates.find((candidate) =>
      resolveHomeClickDestination(candidate.path, candidate.destinationPath)?.startsWith(
        "/login",
      ),
    );

    if (authLandingClick) {
      return authLandingClick;
    }
  }

  return reverseCandidates[0] ?? null;
}

function trackHomeAcquisition(
  homeBlockCounts: Map<
    HomeFunnelBlockKey,
    {
      clicks: number;
      sessions: Set<string>;
      playSessions: Set<string>;
      favoriteSessions: Set<string>;
      loginSessions: Set<string>;
      registerSessions: Set<string>;
      acquisitionSessions: Set<string>;
      firstAcquisitionSessions: Set<string>;
      assistedAcquisitionSessions: Set<string>;
      actionSessions: Set<string>;
    }
  >,
  sessionId: string,
  candidates: HomeClickAttributionCandidate[],
  directAttribution: HomeClickAttributionCandidate | null,
  eventType: "player_login" | "player_register",
) {
  const firstAttribution = candidates[0] ?? null;
  const firstBlockKey = firstAttribution?.block;
  const directBlockKey = directAttribution?.block;

  if (firstBlockKey) {
    homeBlockCounts.get(firstBlockKey)?.firstAcquisitionSessions.add(sessionId);
  }

  if (directBlockKey) {
    const directBlock = homeBlockCounts.get(directBlockKey);

    if (directBlock) {
      if (eventType === "player_login") {
        directBlock.loginSessions.add(sessionId);
      } else {
        directBlock.registerSessions.add(sessionId);
      }

      directBlock.acquisitionSessions.add(sessionId);
      directBlock.actionSessions.add(sessionId);
    }
  }

  const assistedBlocks = new Set<HomeFunnelBlockKey>();

  candidates.forEach((candidate) => {
    if (candidate.block === firstBlockKey || candidate.block === directBlockKey) {
      return;
    }

    assistedBlocks.add(candidate.block);
  });

  assistedBlocks.forEach((blockKey) => {
    homeBlockCounts.get(blockKey)?.assistedAcquisitionSessions.add(sessionId);
  });
}

export function summarizeAnalyticsEvents(
  events: AnalyticsSourceEvent[],
  windowDays: number,
): AnalyticsSummary {
  const chronologicEvents = [...events].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
  const totals = {
    pageViews: 0,
    homeClicks: 0,
    blogImpressions: 0,
    blogClicks: 0,
    blogViews: 0,
    blogCtr: 0,
    gameViews: 0,
    favoritesAdded: 0,
    playerLogins: 0,
    playerRegistrations: 0,
    uniqueSessions: 0,
  };

  const pageCounts = new Map<string, number>();
  const homeClickCounts = new Map<string, number>();
  const homeBlockCounts = new Map<
    HomeFunnelBlockKey,
    {
      clicks: number;
      sessions: Set<string>;
      playSessions: Set<string>;
      favoriteSessions: Set<string>;
      loginSessions: Set<string>;
      registerSessions: Set<string>;
      acquisitionSessions: Set<string>;
      firstAcquisitionSessions: Set<string>;
      assistedAcquisitionSessions: Set<string>;
      actionSessions: Set<string>;
    }
  >(
    HOME_FUNNEL_BLOCKS.map((block) => [
      block.key,
      {
        clicks: 0,
        sessions: new Set<string>(),
        playSessions: new Set<string>(),
        favoriteSessions: new Set<string>(),
        loginSessions: new Set<string>(),
        registerSessions: new Set<string>(),
        acquisitionSessions: new Set<string>(),
        firstAcquisitionSessions: new Set<string>(),
        assistedAcquisitionSessions: new Set<string>(),
        actionSessions: new Set<string>(),
      },
    ]),
  );
  const gameCounts = new Map<string, { gameId: string; title: string; slug: string; views: number }>();
  const blogSourceCounts = new Map<
    string,
    {
      path: string;
      impressions: number;
      clicks: number;
      views: number;
    }
  >();
  const blogPostCounts = new Map<
    string,
    {
      slug: string;
      path: string;
      impressions: number;
      clicks: number;
      views: number;
      sources: Map<
        string,
        {
          path: string;
          impressions: number;
          clicks: number;
          views: number;
        }
      >;
    }
  >();
  const sessionHomeAttribution = new Map<string, HomeClickAttributionCandidate[]>();
  const uniqueSessions = new Set<string>();
  const timelineMap = new Map<string, AnalyticsSummary["timeline"][number]>();

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = formatDay(date);
    timelineMap.set(key, {
      date: key,
      pageViews: 0,
      homeClicks: 0,
      blogImpressions: 0,
      blogClicks: 0,
      blogViews: 0,
      gameViews: 0,
      favoritesAdded: 0,
      playerLogins: 0,
      playerRegistrations: 0,
    });
  }

  chronologicEvents.forEach((event) => {
    if (event.sessionId) {
      uniqueSessions.add(event.sessionId);
    }

    const timelineKey = formatDay(event.createdAt);
    const bucket = timelineMap.get(timelineKey);

    switch (event.type) {
      case "page_view":
        totals.pageViews += 1;
        pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
        if (bucket) {
          bucket.pageViews += 1;
        }
        break;
      case "home_click":
        totals.homeClicks += 1;
        homeClickCounts.set(event.path, (homeClickCounts.get(event.path) ?? 0) + 1);
        const homeBlock = getHomeClickBlock(event.path);
        const blockState = homeBlockCounts.get(homeBlock);
        if (blockState) {
          blockState.clicks += 1;
          if (event.sessionId) {
            blockState.sessions.add(event.sessionId);
            const timestamp = event.createdAt.getTime();
            const nextCandidates = [
              ...(sessionHomeAttribution.get(event.sessionId) ?? []),
              {
                block: homeBlock,
                path: event.path,
                destinationPath: event.destinationPath,
                clickedAt: timestamp,
              },
            ].filter(
              (candidate) =>
                timestamp - candidate.clickedAt <= HOME_CONVERSION_ATTRIBUTION_WINDOW_MS,
            );

            sessionHomeAttribution.set(event.sessionId, nextCandidates);
          }
        }
        if (bucket) {
          bucket.homeClicks += 1;
        }
        break;
      case "blog_impression": {
        totals.blogImpressions += 1;
        if (bucket) {
          bucket.blogImpressions += 1;
        }

        const sourcePath = normalizeAnalyticsPath(event.path);
        const postPath = normalizeAnalyticsPath(event.destinationPath);
        const slug = extractBlogSlugFromPath(postPath);

        if (!sourcePath || !postPath || !slug) {
          break;
        }

        const source = blogSourceCounts.get(sourcePath) ?? {
          path: sourcePath,
          impressions: 0,
          clicks: 0,
          views: 0,
        };
        source.impressions += 1;
        blogSourceCounts.set(sourcePath, source);

        const post = blogPostCounts.get(slug) ?? {
          slug,
          path: postPath,
          impressions: 0,
          clicks: 0,
          views: 0,
          sources: new Map(),
        };
        post.impressions += 1;
        const postSource = post.sources.get(sourcePath) ?? {
          path: sourcePath,
          impressions: 0,
          clicks: 0,
          views: 0,
        };
        postSource.impressions += 1;
        post.sources.set(sourcePath, postSource);
        blogPostCounts.set(slug, post);
        break;
      }
      case "blog_click": {
        totals.blogClicks += 1;
        if (bucket) {
          bucket.blogClicks += 1;
        }

        const sourcePath = normalizeAnalyticsPath(event.path);
        const postPath = normalizeAnalyticsPath(event.destinationPath);
        const slug = extractBlogSlugFromPath(postPath);

        if (!sourcePath || !postPath || !slug) {
          break;
        }

        const source = blogSourceCounts.get(sourcePath) ?? {
          path: sourcePath,
          impressions: 0,
          clicks: 0,
          views: 0,
        };
        source.clicks += 1;
        blogSourceCounts.set(sourcePath, source);

        const post = blogPostCounts.get(slug) ?? {
          slug,
          path: postPath,
          impressions: 0,
          clicks: 0,
          views: 0,
          sources: new Map(),
        };
        post.clicks += 1;
        const postSource = post.sources.get(sourcePath) ?? {
          path: sourcePath,
          impressions: 0,
          clicks: 0,
          views: 0,
        };
        postSource.clicks += 1;
        post.sources.set(sourcePath, postSource);
        blogPostCounts.set(slug, post);
        break;
      }
      case "blog_view": {
        totals.blogViews += 1;
        if (bucket) {
          bucket.blogViews += 1;
        }

        const postPath = normalizeAnalyticsPath(event.path);
        const slug = extractBlogSlugFromPath(postPath);

        if (!postPath || !slug) {
          break;
        }

        const post = blogPostCounts.get(slug) ?? {
          slug,
          path: postPath,
          impressions: 0,
          clicks: 0,
          views: 0,
          sources: new Map(),
        };
        post.views += 1;

        const sourcePath = normalizeAnalyticsPath(event.referrer);
        if (sourcePath) {
          const source = blogSourceCounts.get(sourcePath) ?? {
            path: sourcePath,
            impressions: 0,
            clicks: 0,
            views: 0,
          };
          source.views += 1;
          blogSourceCounts.set(sourcePath, source);

          const postSource = post.sources.get(sourcePath) ?? {
            path: sourcePath,
            impressions: 0,
            clicks: 0,
            views: 0,
          };
          postSource.views += 1;
          post.sources.set(sourcePath, postSource);
        }

        blogPostCounts.set(slug, post);
        break;
      }
      case "game_view":
        totals.gameViews += 1;
        if (event.sessionId) {
          const attribution = resolveHomeAttribution(
            getRecentHomeClickCandidates(
              sessionHomeAttribution,
              event.sessionId,
              event.createdAt.getTime(),
            ),
            event,
          );

          if (attribution) {
            const attributedBlock = homeBlockCounts.get(attribution.block);
            if (attributedBlock) {
              attributedBlock.playSessions.add(event.sessionId);
              attributedBlock.actionSessions.add(event.sessionId);
            }
          }
        }
        if (event.gameId && event.gameTitle && event.gameSlug) {
          const current = gameCounts.get(event.gameId) ?? {
            gameId: event.gameId,
            title: event.gameTitle,
            slug: event.gameSlug,
            views: 0,
          };
          current.views += 1;
          gameCounts.set(event.gameId, current);
        }
        if (bucket) {
          bucket.gameViews += 1;
        }
        break;
      case "favorite_add":
        totals.favoritesAdded += 1;
        if (event.sessionId) {
          const attribution = resolveHomeAttribution(
            getRecentHomeClickCandidates(
              sessionHomeAttribution,
              event.sessionId,
              event.createdAt.getTime(),
            ),
            event,
          );

          if (attribution) {
            const attributedBlock = homeBlockCounts.get(attribution.block);
            if (attributedBlock) {
              attributedBlock.favoriteSessions.add(event.sessionId);
              attributedBlock.actionSessions.add(event.sessionId);
            }
          }
        }
        if (bucket) {
          bucket.favoritesAdded += 1;
        }
        break;
      case "player_login":
        totals.playerLogins += 1;
        if (event.sessionId) {
          const recentCandidates = getRecentHomeClickCandidates(
            sessionHomeAttribution,
            event.sessionId,
            event.createdAt.getTime(),
          );
          const attribution = resolveHomeAttribution(recentCandidates, event);

          if (recentCandidates.length > 0) {
            trackHomeAcquisition(
              homeBlockCounts,
              event.sessionId,
              recentCandidates,
              attribution,
              "player_login",
            );
          }
        }
        if (bucket) {
          bucket.playerLogins += 1;
        }
        break;
      case "player_register":
        totals.playerRegistrations += 1;
        if (event.sessionId) {
          const recentCandidates = getRecentHomeClickCandidates(
            sessionHomeAttribution,
            event.sessionId,
            event.createdAt.getTime(),
          );
          const attribution = resolveHomeAttribution(recentCandidates, event);

          if (recentCandidates.length > 0) {
            trackHomeAcquisition(
              homeBlockCounts,
              event.sessionId,
              recentCandidates,
              attribution,
              "player_register",
            );
          }
        }
        if (bucket) {
          bucket.playerRegistrations += 1;
        }
        break;
      default:
        break;
    }
  });

  totals.uniqueSessions = uniqueSessions.size;
  totals.blogCtr =
    totals.blogImpressions > 0
      ? Number(((totals.blogClicks / totals.blogImpressions) * 100).toFixed(1))
      : 0;
  const homeViews = pageCounts.get("/") ?? 0;

  return {
    totals,
    timeline: Array.from(timelineMap.values()),
    topPages: Array.from(pageCounts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((left, right) => right.views - left.views)
      .slice(0, 5),
    topHomeInteractions: Array.from(homeClickCounts.entries())
      .map(([path, clicks]) => ({ path, clicks }))
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 6),
    homeFunnel: {
      homeViews,
      blocks: HOME_FUNNEL_BLOCKS.map((block) => {
        const state = homeBlockCounts.get(block.key) ?? {
          clicks: 0,
          sessions: new Set<string>(),
          playSessions: new Set<string>(),
          favoriteSessions: new Set<string>(),
          loginSessions: new Set<string>(),
          registerSessions: new Set<string>(),
          acquisitionSessions: new Set<string>(),
          firstAcquisitionSessions: new Set<string>(),
          assistedAcquisitionSessions: new Set<string>(),
          actionSessions: new Set<string>(),
        };
        const clickedSessions = state.sessions.size;

        return {
          block: block.key,
          label: block.label,
          clicks: state.clicks,
          uniqueSessions: clickedSessions,
          playSessions: state.playSessions.size,
          favoriteSessions: state.favoriteSessions.size,
          loginSessions: state.loginSessions.size,
          registerSessions: state.registerSessions.size,
          acquisitionSessions: state.acquisitionSessions.size,
          firstAcquisitionSessions: state.firstAcquisitionSessions.size,
          assistedAcquisitionSessions: state.assistedAcquisitionSessions.size,
          actionSessions: state.actionSessions.size,
          conversionRate:
            homeViews > 0 ? Number(((state.clicks / homeViews) * 100).toFixed(1)) : 0,
          playConversionRate:
            clickedSessions > 0
              ? Number(((state.playSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          favoriteConversionRate:
            clickedSessions > 0
              ? Number(((state.favoriteSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          loginConversionRate:
            clickedSessions > 0
              ? Number(((state.loginSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          registerConversionRate:
            clickedSessions > 0
              ? Number(((state.registerSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          acquisitionConversionRate:
            clickedSessions > 0
              ? Number(((state.acquisitionSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          firstAcquisitionRate:
            clickedSessions > 0
              ? Number(((state.firstAcquisitionSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          assistedAcquisitionRate:
            clickedSessions > 0
              ? Number(((state.assistedAcquisitionSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          actionConversionRate:
            clickedSessions > 0
              ? Number(((state.actionSessions.size / clickedSessions) * 100).toFixed(1))
              : 0,
          shareOfHomeClicks:
            totals.homeClicks > 0
              ? Number(((state.clicks / totals.homeClicks) * 100).toFixed(1))
              : 0,
        };
      }),
    },
    topGames: Array.from(gameCounts.values())
      .sort((left, right) => right.views - left.views)
      .slice(0, 5),
    blogPerformance: {
      impressions: totals.blogImpressions,
      clicks: totals.blogClicks,
      views: totals.blogViews,
      ctr: totals.blogCtr,
      topSources: Array.from(blogSourceCounts.values())
        .map((entry) => ({
          ...entry,
          ctr:
            entry.impressions > 0
              ? Number(((entry.clicks / entry.impressions) * 100).toFixed(1))
              : 0,
          clickToViewRate:
            entry.clicks > 0
              ? Number(((entry.views / entry.clicks) * 100).toFixed(1))
              : 0,
        }))
        .sort((left, right) => right.clicks - left.clicks || right.views - left.views)
        .slice(0, 6),
      posts: Array.from(blogPostCounts.values())
        .map((entry) => {
          const sources = Array.from(entry.sources.values())
            .map((source) => ({
              ...source,
              ctr:
                source.impressions > 0
                  ? Number(((source.clicks / source.impressions) * 100).toFixed(1))
                  : 0,
              clickToViewRate:
                source.clicks > 0
                  ? Number(((source.views / source.clicks) * 100).toFixed(1))
                  : 0,
            }))
            .sort((left, right) => right.clicks - left.clicks || right.views - left.views);

          return {
            slug: entry.slug,
            path: entry.path,
            impressions: entry.impressions,
            clicks: entry.clicks,
            views: entry.views,
            ctr:
              entry.impressions > 0
                ? Number(((entry.clicks / entry.impressions) * 100).toFixed(1))
                : 0,
            clickToViewRate:
              entry.clicks > 0
                ? Number(((entry.views / entry.clicks) * 100).toFixed(1))
                : 0,
            topSource: sources[0]?.path ?? null,
            sources: sources.slice(0, 4),
          };
        })
        .sort(
          (left, right) =>
            right.clicks - left.clicks ||
            right.views - left.views ||
            right.impressions - left.impressions,
        ),
    },
  };
}

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const storageKey = "arcade_analytics_session";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  window.localStorage.setItem(storageKey, next);
  return next;
}