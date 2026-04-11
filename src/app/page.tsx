import Image from "next/image";
import { cookies } from "next/headers";

import { listAchievementDefinitions } from "@/data/achievementDefinitionsStore";
import { listPublishedBlogPosts, type BlogPostRecord } from "@/data/blogPosts";
import { listGames, listCategories, listCategoryShowcasesPage, type GameRecord } from "@/data/gamesStore";
import { getPlayerGamificationOverview } from "@/data/gamificationStore";
import { listFriendLeaderboard } from "@/data/socialStore";
import {
  getPlayerLeaderboardPosition,
  getPlayerProfile,
  getPlayerTasteProfile,
  listFavoriteGames,
  listRecommendedGames,
  listRecentlyPlayed,
  listTopPlayers,
} from "@/data/playerStore";
import { buildDailyMission } from "@/lib/daily-missions";
import {
  type AchievementEvaluationSnapshot,
  DEFAULT_ACHIEVEMENT_DEFINITIONS,
  getAchievementProgress,
} from "@/lib/gamification";
import { getRecommendedReason, resolveHeroGame } from "@/lib/home-feed";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";
import { getDictionary, t as tr } from "@/lib/i18n";
import { getSingleQueryValue } from "@/lib/pagination";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AdSlot } from "./components/AdSlot";
import { AntiAdBlockGuard } from "./components/AntiAdBlockGuard";
import { BlogImpressionTracker } from "./components/BlogAnalyticsTrackers";
import { CategorySidebarNav } from "./components/CategorySidebarNav";
import { HomeRightSidebar } from "./components/HomeRightSidebar";
import { HomeThemeCatalog } from "./components/HomeThemeCatalog";
import { TrackedLink } from "./components/TrackedLink";
import { CatalogGameCard } from "./components/CatalogGameCard";
import { Footer } from "./components/Footer";

type HomeGame = Pick<
  GameRecord,
  "id" | "title" | "slug" | "thumbnail" | "description" | "category" | "views" | "featured"
>;

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join("");
}

function formatViews(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getLeaderboardBannerGradient(profileTheme: string, categories: string[]) {
  const themeKey = `${profileTheme} ${categories.join(" ")}`.toLowerCase();

  if (themeKey.includes("cyber") || themeKey.includes("arcade") || themeKey.includes("neon")) {
    return "from-fuchsia-500/80 via-cyan-400/55 to-slate-950";
  }

  if (themeKey.includes("fire") || themeKey.includes("action") || themeKey.includes("fighting")) {
    return "from-orange-500/80 via-amber-300/55 to-slate-950";
  }

  if (themeKey.includes("forest") || themeKey.includes("adventure") || themeKey.includes("rpg")) {
    return "from-emerald-500/75 via-cyan-300/45 to-slate-950";
  }

  return "from-sky-500/80 via-indigo-400/45 to-slate-950";
}

function getLeaderboardProfileTag(dict: any, categories: string[]) {
  const primaryCategory = categories[0];
  if (primaryCategory) return primaryCategory;
  return tr(dict, "home.featuredLabel");
}

function getLeaderboardStatLabel(dict: any, type: "achievements" | "friends") {
  if (type === "achievements") return tr(dict, "player.achievements");
  return tr(dict, "player.friends");
}

function getLeaderboardStreakLabel(dict: any) {
  return tr(dict, "player.streak");
}

function getPlayerHubTag(dict: any, categories: string[]) {
  const primaryCategory = categories[0];
  if (primaryCategory) return primaryCategory;
  return tr(dict, "common.account");
}

function getPlayerSidebarQuickLabel(
  dict: any,
  type: "favorites" | "played" | "achievements" | "friends",
) {
  if (type === "favorites") return tr(dict, "player.favorites");
  if (type === "played") return tr(dict, "player.played");
  return getLeaderboardStatLabel(dict, type === "achievements" ? "achievements" : "friends");
}

const ACHIEVEMENT_SHOWCASE_ORDER = new Map(
  DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition, index) => [definition.key, index]),
);

const GUEST_ACHIEVEMENT_SNAPSHOT: AchievementEvaluationSnapshot = {
  accountCreated: false,
  totalGamesPlayed: 0,
  uniqueGamesPlayed: 0,
  totalFavorites: 0,
  currentStreak: 0,
  hasProfileSetup: false,
  totalXp: 0,
  level: 1,
  totalRatings: 0,
  totalAds: 0,
  totalComments: 0,
};

const LEADERBOARD_SEALS = [
  { src: "/leaderboard/place-1.png", alt: "1º lugar" },
  { src: "/leaderboard/place-2.png", alt: "2º lugar" },
  { src: "/leaderboard/place-3.png", alt: "3º lugar" },
] as const;
const TARGET_LEADERBOARD_SIZE = 15;
const PODIUM_DISPLAY_ORDER = [0, 1, 2] as const;
const PODIUM_CARD_STYLES = [
  {
    card: "leaderboard-podium-gold min-h-[114px] border-amber-300/35 bg-[radial-gradient(circle_at_top,rgba(252,211,77,0.24),rgba(15,23,42,0.98)_62%)] shadow-[0_0_24px_rgba(252,211,77,0.12)]",
    avatar: "h-[3.6rem] w-[3.6rem] border-amber-300/55 bg-amber-400/12 text-amber-100",
    score: "text-amber-100",
  },
  {
    card: "min-h-[112px] border-slate-300/20 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.12),rgba(15,23,42,0.96)_68%)]",
    avatar: "h-11 w-11 border-slate-300/35 bg-slate-200/10 text-slate-100",
    score: "text-slate-100",
  },
  {
    card: "min-h-[112px] border-orange-300/20 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),rgba(15,23,42,0.96)_68%)]",
    avatar: "h-11 w-11 border-orange-300/35 bg-orange-400/10 text-orange-100",
    score: "text-orange-100",
  },
] as const;

/* ── Section heading ── */
function SectionTitle({
  title,
  actionHref,
  actionLabel,
  trackingPath,
  count,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  trackingPath?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[9px] font-medium text-slate-400 tabular-nums">{count}</span>
        )}
      </div>
      {actionHref && actionLabel && trackingPath ? (
        <TrackedLink href={actionHref} trackingPath={trackingPath} className="group/link flex items-center gap-1 rounded-md bg-slate-800/40 px-2 py-1 text-[11px] text-slate-500 transition-colors hover:text-cyan-300 hover:bg-slate-800/70">
          {actionLabel}
          <span className="inline-block transition-transform group-hover/link:translate-x-0.5">→</span>
        </TrackedLink>
      ) : null}
    </div>
  );
}

/* ── Game card bridge ── */
function HomeGameCard({ game }: { game: GameRecord }) {
  return (
    <CatalogGameCard game={game} />
  );
}

/* ── Blog card ── */
function BlogCard({ post, locale, featured = false }: { post: BlogPostRecord; locale: string; featured?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] animate-fade-in-up ${featured ? "col-span-2 md:col-span-2" : ""}`}>
      <BlogImpressionTracker sourcePath="/" destinationPath={`/blog/${post.slug}`} />
      <TrackedLink
        href={`/blog/${post.slug}`}
        trackingPath={`/home/blog/${post.slug}`}
        trackingEventType="blog_click"
        trackingDestinationPath={`/blog/${post.slug}`}
        className="group block"
      >
        {post.coverImageUrl ? (
          <div className={`relative overflow-hidden bg-slate-950 ${featured ? "aspect-[2/1]" : "aspect-[16/9]"}`}>
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-300 mb-1">
                <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-cyan-200 font-medium">{post.category}</span>
                <span>{formatDate(post.publishedAt, locale)}</span>
                <span>•</span>
                <span>{post.readingTime}</span>
              </div>
              <h3 className={`line-clamp-2 font-semibold text-white transition-colors group-hover:text-cyan-200 ${featured ? "text-base" : "text-[13px]"}`}>{post.title}</h3>
              {featured && post.excerpt ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{post.excerpt}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">{post.category}</span>
              <span>{formatDate(post.publishedAt, locale)}</span>
            </div>
            <h3 className="line-clamp-2 text-[13px] font-semibold text-slate-100 transition-colors group-hover:text-cyan-200">{post.title}</h3>
          </div>
        )}
      </TrackedLink>
    </article>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialCategory = getSingleQueryValue(resolvedSearchParams.category)?.trim() ?? "";
  const initialQuery = getSingleQueryValue(resolvedSearchParams.q)?.trim() ?? "";
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  console.log(`[DEBUG] Resolved Locale for Home: ${locale}`);
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const dict = await getDictionary(locale);
  const t = { ...dict.common, ...dict.home };

  const currentUserId = playerSession?.user.id;

  const [
    featuredGames,
    popularGames,
    categories,
    themeSectionsPage,
    blogPosts,
    topPlayers,
    profile,
    recommendedGames,
    historyEntries,
    favorites,
    gamification,
    tasteProfile,
    leaderboardPosition,
    friendLeaderboard,
    achievementDefinitions,
  ] = await Promise.all([
    listGames({ publishedOnly: true, featured: true, limit: 18, sortBy: "random", currentUserId }),
    listGames({ publishedOnly: true, limit: 24, sortBy: "random", currentUserId }),
    listCategories({ order: "editorial" }),
    listCategoryShowcasesPage({
      limit: 4,
      gamesPerCategory: 18,
      sortBy: "random",
      categoryOrder: "editorial",
      currentUserId,
    }),
    listPublishedBlogPosts(4),
    listTopPlayers(TARGET_LEADERBOARD_SIZE),
    playerSession ? getPlayerProfile(playerSession.user.id) : null,
    playerSession ? listRecommendedGames(playerSession.user.id, 8) : [],
    playerSession ? listRecentlyPlayed(playerSession.user.id, 8) : [],
    playerSession ? listFavoriteGames(playerSession.user.id, 24) : [],
    playerSession ? getPlayerGamificationOverview(playerSession.user.id) : null,
    playerSession ? getPlayerTasteProfile(playerSession.user.id) : null,
    playerSession ? getPlayerLeaderboardPosition(playerSession.user.id) : null,
    playerSession ? listFriendLeaderboard(playerSession.user.id) : [],
    listAchievementDefinitions(),
  ]);

  const continuePlayingGames = historyEntries.map((entry) => entry.game);
  const hero = resolveHeroGame({
    continuePlayingGames,
    recommendedGames,
    featuredGames,
    allGames: popularGames,
  });
  const heroGame = hero.game;
  const missionCard = buildDailyMission({
    locale,
    isAuthenticated: Boolean(playerSession),
    mission: gamification?.dailyMission ?? null,
  });
  const achievementSnapshot = gamification?.achievementSnapshot ?? GUEST_ACHIEVEMENT_SNAPSHOT;
  const unlockedAchievementKeys = new Set(gamification?.unlockedAchievementKeys ?? []);
  const achievementRailItems = [...achievementDefinitions]
    .sort((left, right) => {
      const leftOrder = ACHIEVEMENT_SHOWCASE_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = ACHIEVEMENT_SHOWCASE_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.createdAt.localeCompare(right.createdAt);
    })
    .map((definition) => {
      const progress = getAchievementProgress(definition, achievementSnapshot);

      return {
        ...definition,
        unlocked: unlockedAchievementKeys.has(definition.key),
        currentValue: progress.currentValue,
        targetValue: progress.targetValue,
        progressPercent: progress.progressPercent,
      };
    });
  const podiumPlayers = topPlayers.slice(0, 3);
  const podiumOrder =
    podiumPlayers.length >= 3
      ? PODIUM_DISPLAY_ORDER.filter((index) => podiumPlayers[index])
      : podiumPlayers.map((_, index) => index);
  const podiumGridClassName =
    podiumPlayers.length === 1 ? "grid-cols-1" : "grid-cols-2";
  const remainingLeaderboardEntries = Array.from(
    { length: Math.max(TARGET_LEADERBOARD_SIZE - 3, 0) },
    (_, index) => ({
      rank: index + 4,
      player: topPlayers[index + 3] ?? null,
    }),
  );
  const playerHubBannerGradient = getLeaderboardBannerGradient(
    "default",
    profile?.preferredCategories ?? [],
  );
  const playerHubTag = getPlayerHubTag(dict, profile?.preferredCategories ?? []);
  const sidebarFriendCount = playerSession ? Math.max(friendLeaderboard.length - 1, 0) : 0;
  const recommendedReason = getRecommendedReason(profile, recommendedGames);
  const homeThemeSections = themeSectionsPage.items;
  const heroTitle =
    hero.mode === "continue"
      ? t.heroPersonalizedContinue
      : hero.mode === "recommended"
      ? t.heroPersonalizedRecommended
      : t.heroPersonalizedFeatured;

  if (!heroGame) {
    return (
      <div className="p-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-8">
          <h1 className="text-2xl font-bold text-slate-50">{t.heroTitle}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.empty}</p>
          <TrackedLink href="/#catalogo" trackingPath="/home/section-header/popular" className="mt-4 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            {t.readAll}
          </TrackedLink>
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-full">

      {/* ████ LEFT SIDEBAR — Categorias ████ */}
      <aside className="hidden lg:flex w-[160px] min-w-0 flex-none flex-col border-r border-slate-800/60 bg-slate-950/60 overflow-y-auto scrollbar-thin animate-slide-in-left">
        <CategorySidebarNav
          categories={categories}
        />
      </aside>

      {/* ████ CENTER — Jogos ████ */}
      <main className="relative z-[1] flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        {/* Anti-AdBlock system */}
        <AntiAdBlockGuard />

        {/* Top banner ad */}
        <div className="px-4 pt-3">
          <AdSlot label={t.bannerTop} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />
        </div>

        {/* Hero banner removed to save vertical space */}

        {/* Game sections */}
        <div className="px-4 pb-6 space-y-6">

          {/* Continue playing */}
          {continuePlayingGames.length > 0 ? (
            <section>
              <SectionTitle title={t.continueLabel} actionHref="/account" actionLabel={t.readAll} trackingPath="/home/section-header/continue" count={continuePlayingGames.length} />
              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div
                  className="grid gap-2 lg:gap-3"
                  style={{
                    gridTemplateRows: "1fr",
                    gridAutoFlow: "column",
                    gridAutoColumns: "clamp(130px, calc((100vw - 520px) / 5), 210px)",
                  }}
                >
                  {continuePlayingGames.map((game) => (
                    <HomeGameCard key={game.id} game={game as any} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* Recommended */}
          {recommendedGames.length > 0 ? (
            <section>
              <SectionTitle title={t.recommendedLabel} actionHref="/account" actionLabel={t.readAll} trackingPath="/home/section-header/recommended" count={recommendedGames.length} />
              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div
                  className="grid gap-2 lg:gap-3"
                  style={{
                    gridTemplateRows: "1fr",
                    gridAutoFlow: "column",
                    gridAutoColumns: "clamp(130px, calc((100vw - 520px) / 5), 210px)",
                  }}
                >
                  {recommendedGames.map((game) => (
                    <HomeGameCard key={game.id} game={game as any} />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <HomeThemeCatalog
            initialSections={homeThemeSections}
            initialHasMore={themeSectionsPage.hasMore}
            initialNextOffset={themeSectionsPage.nextOffset}
            initialCategory={initialCategory}
            initialQuery={initialQuery}
            isAuthenticated={Boolean(playerSession)}
          />

          {/* Mid-catalog ad — after theme sections, before featured */}
          <AdSlot label={t.bannerMiddle} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_MIDDLE} />

          {/* Featured */}
          {featuredGames.length > 0 ? (
            <section>
              <SectionTitle title={t.featuredLabel} actionHref="/#catalogo" actionLabel={t.readAll} trackingPath="/home/section-header/featured" count={featuredGames.length} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3 stagger-children">
                {featuredGames.map((game) => (
                  <HomeGameCard key={game.id} game={game as any} />
                ))}
              </div>
            </section>
          ) : null}

          {/* In-feed ad — between featured and popular */}
          <AdSlot label="Feed" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED} minHeight={100} />

          {/* Popular */}
          <section>
            <SectionTitle title={t.popularLabel} actionHref="/#catalogo" actionLabel={t.readAll} trackingPath="/home/section-header/popular" count={popularGames.length} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3 stagger-children">
              {popularGames.map((game) => (
                <HomeGameCard key={game.id} game={game as any} />
              ))}
            </div>
          </section>

          {/* Pre-blog ad — after popular, before blog */}
          <AdSlot label="Conteúdo" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_CONTENT} minHeight={100} />

          {/* Blog */}
          {blogPosts.length > 0 ? (
            <section>
              <SectionTitle title={t.blogTitle} actionHref="/blog" actionLabel={t.readAll} trackingPath="/home/blog/index" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {blogPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} locale={locale} featured={index === 0 && blogPosts.length > 1} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Footer inside scrolling area */}
          <div className="pt-8 border-t border-slate-800/40">
            <Footer />
          </div>
        </div>
      </main>

      {/* ████ RIGHT SIDEBAR — Player / Ranking ████ */}
      <HomeRightSidebar />
    </div>
  );
}

