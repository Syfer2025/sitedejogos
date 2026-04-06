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
import { getHomeTexts } from "@/lib/home-content";
import { getRecommendedReason, resolveHeroGame } from "@/lib/home-feed";
import { getLocaleContentLocale, LOCALE_COOKIE_NAME, resolveLocale, type Locale } from "@/lib/locale";
import { getSingleQueryValue } from "@/lib/pagination";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AdSlot } from "./components/AdSlot";
import { BlogImpressionTracker } from "./components/BlogAnalyticsTrackers";
import { CategorySidebarNav } from "./components/CategorySidebarNav";
import { HomeAchievementsRail } from "./components/HomeAchievementsRail";
import { HomeThemeCatalog } from "./components/HomeThemeCatalog";
import { TrackedLink } from "./components/TrackedLink";

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

function getLeaderboardProfileTag(locale: Locale, categories: string[]) {
  const primaryCategory = categories[0];
  const contentLocale = getLocaleContentLocale(locale);

  if (primaryCategory) {
    return primaryCategory;
  }

  if (contentLocale === "en") return "Top player";
  if (contentLocale === "es") return "Jugador top";
  return "Destaque";
}

function getLeaderboardStatLabel(locale: Locale, type: "achievements" | "friends") {
  const contentLocale = getLocaleContentLocale(locale);

  if (type === "achievements") {
    if (contentLocale === "en") return "Achievements";
    if (contentLocale === "es") return "Logros";
    return "Conquistas";
  }

  if (contentLocale === "en") return "Friends";
  if (contentLocale === "es") return "Amigos";
  return "Amigos";
}

function getLeaderboardStreakLabel(locale: Locale) {
  const contentLocale = getLocaleContentLocale(locale);

  if (contentLocale === "en") return "streak";
  if (contentLocale === "es") return "racha";
  return "sequência";
}

function getPlayerHubTag(locale: Locale, categories: string[]) {
  const primaryCategory = categories[0];
  const contentLocale = getLocaleContentLocale(locale);

  if (primaryCategory) {
    return primaryCategory;
  }

  if (contentLocale === "en") return "Player hub";
  if (contentLocale === "es") return "Perfil gamer";
  return "Hub do jogador";
}

function getPlayerSidebarQuickLabel(
  locale: Locale,
  type: "favorites" | "played" | "achievements" | "friends",
) {
  const contentLocale = getLocaleContentLocale(locale);

  if (type === "favorites") {
    if (contentLocale === "en") return "Favorites";
    if (contentLocale === "es") return "Favoritos";
    return "Favoritos";
  }

  if (type === "played") {
    if (contentLocale === "en") return "Played";
    if (contentLocale === "es") return "Jugados";
    return "Jogados";
  }

  return getLeaderboardStatLabel(locale, type);
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
  level: 0,
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
    <div className="flex items-center justify-between mb-3 animate-fade-in">
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

/* ── Game card for the center grid ── */
function GameCard({
  game,
  trackingPath,
  locale,
  badge,
  size = "normal",
}: {
  game: HomeGame;
  trackingPath: string;
  locale: string;
  badge?: string | null;
  size?: "normal" | "large";
}) {
  return (
    <TrackedLink
      href={`/games/${game.slug}`}
      trackingPath={trackingPath}
      className="group block overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-800/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 animate-fade-in-up"
    >
      <div className={`game-card-play relative ${size === "large" ? "aspect-[16/9]" : "aspect-[16/10]"} overflow-hidden bg-slate-950`}>
        <Image
          src={game.thumbnail}
          alt={game.title}
          fill
          sizes={size === "large" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 group-hover:from-black/60" />
        {badge ? (
          <span className="absolute right-2 top-2 rounded bg-cyan-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg shadow-cyan-400/20">
            {badge}
          </span>
        ) : null}
        {game.featured ? (
          <span className="absolute left-2 top-2 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg shadow-amber-400/20">
            ★
          </span>
        ) : null}
        {/* Views badge bottom-right */}
        <span className="absolute right-2 bottom-2 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] text-slate-300 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          👁 {formatViews(game.views, locale)}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="truncate text-[13px] font-semibold text-slate-100 transition-colors group-hover:text-cyan-200">{game.title}</h3>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <span className="transition-colors group-hover:text-slate-400">{game.category}</span>
          <span className="opacity-0 group-hover:opacity-100 text-cyan-400 font-semibold transition-opacity">Jogar →</span>
        </div>
      </div>
    </TrackedLink>
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
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const t = getHomeTexts(locale);

  const [
    featuredGames,
    newGames,
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
    listGames({ publishedOnly: true, featured: true, limit: 12, sortBy: "popular" }),
    listGames({ publishedOnly: true, limit: 12, sortBy: "newest" }),
    listGames({ publishedOnly: true, limit: 12, sortBy: "popular" }),
    listCategories({ order: "editorial" }),
    listCategoryShowcasesPage({
      limit: 4,
      gamesPerCategory: 14,
      sortBy: "popular",
      categoryOrder: "editorial",
    }),
    listPublishedBlogPosts(4),
    listTopPlayers(TARGET_LEADERBOARD_SIZE),
    playerSession ? getPlayerProfile(playerSession.user.id) : Promise.resolve(null),
    playerSession ? listRecommendedGames(playerSession.user.id, 8) : Promise.resolve([]),
    playerSession ? listRecentlyPlayed(playerSession.user.id, 8) : Promise.resolve([]),
    playerSession ? listFavoriteGames(playerSession.user.id, 24) : Promise.resolve([]),
    playerSession ? getPlayerGamificationOverview(playerSession.user.id) : Promise.resolve(null),
    playerSession ? getPlayerTasteProfile(playerSession.user.id) : Promise.resolve(null),
    playerSession ? getPlayerLeaderboardPosition(playerSession.user.id) : Promise.resolve(null),
    playerSession ? listFriendLeaderboard(playerSession.user.id) : Promise.resolve([]),
    listAchievementDefinitions(),
  ]);

  const continuePlayingGames = historyEntries.map((entry) => entry.game);
  const hero = resolveHeroGame({
    continuePlayingGames,
    recommendedGames,
    featuredGames,
    allGames: popularGames.length > 0 ? popularGames : newGames,
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
  const playerHubTag = getPlayerHubTag(locale, profile?.preferredCategories ?? []);
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
    <div className="flex h-[calc(100vh-57px)]">

      {/* ████ LEFT SIDEBAR — Categorias ████ */}
      <aside className="hidden lg:flex w-[200px] flex-none flex-col border-r border-slate-800/60 bg-slate-950/60 overflow-y-auto scrollbar-thin animate-slide-in-left">
        <CategorySidebarNav
          categories={categories}
          allLabel={t.readAll}
          blogLabel={t.blogTitle}
        />
      </aside>

      {/* ████ CENTER — Jogos ████ */}
      <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        {/* Top banner ad */}
        <div className="px-4 pt-3">
          <AdSlot label={t.bannerTop} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />
        </div>

        {/* Hero banner */}
        <div className="p-4">
          <section className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950 animate-fade-in-up group/hero transition-all duration-500 hover:border-cyan-400/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.06)]">
            <div className="absolute inset-0">
              <Image src={heroGame.thumbnail} alt={heroGame.title} fill priority sizes="100vw" className="object-cover opacity-30 blur-sm scale-105 transition-transform duration-[2000ms] group-hover/hero:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
            </div>
            <div className="relative flex flex-col md:flex-row items-end md:items-center p-5 md:p-8 min-h-[220px] md:min-h-[280px] gap-6">
              <div className="space-y-3 flex-1 max-w-2xl">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <span className="rounded-md bg-cyan-400 px-2 py-0.5 font-bold text-slate-950">{t.heroChip}</span>
                  <span className="text-cyan-200/70">{heroTitle}</span>
                </div>
                <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl drop-shadow-lg leading-tight">{heroGame.title}</h1>
                <p className="text-sm text-slate-300/90 line-clamp-2 leading-relaxed">
                  {hero.mode === "recommended" && tasteProfile?.recommendationSummary ? tasteProfile.recommendationSummary : heroGame.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {heroGame.category ? <span className="rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">{heroGame.category}</span> : null}
                  <span className="rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">👁 {formatViews(heroGame.views, locale)} views</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <TrackedLink href={`/games/${heroGame.slug}`} trackingPath={`/home/hero/${hero.mode}/${heroGame.slug}`} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all duration-200 hover:bg-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] hover:scale-[1.03] active:scale-[0.98]">
                    ▶ {t.ctaPlay}
                  </TrackedLink>
                  <TrackedLink href={playerSession ? missionCard.href : "/login?mode=register"} trackingPath={playerSession ? "/home/mission/action" : "/home/cta/register"} className="inline-flex items-center rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 backdrop-blur transition-all duration-200 hover:border-cyan-400/40 hover:text-white hover:bg-slate-800/80 active:scale-[0.98]">
                    {playerSession ? missionCard.ctaLabel : t.ctaRegister}
                  </TrackedLink>
                </div>
              </div>
              {/* Hero thumbnail preview */}
              <div className="hidden md:block relative w-48 aspect-[16/10] rounded-xl overflow-hidden border-2 border-white/10 shadow-xl shadow-black/40 flex-none group-hover/hero:border-cyan-400/30 transition-colors duration-300">
                <Image src={heroGame.thumbnail} alt={heroGame.title} fill sizes="200px" className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                  <span className="text-2xl text-white drop-shadow-lg">▶</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Game sections */}
        <div className="px-4 pb-6 space-y-6">

          {/* Continue playing */}
          {continuePlayingGames.length > 0 ? (
            <section>
              <SectionTitle title={t.continueLabel} actionHref="/account" actionLabel={t.readAll} trackingPath="/home/section-header/continue" count={continuePlayingGames.length} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
                {continuePlayingGames.map((game) => (
                  <GameCard key={game.id} game={game} trackingPath={`/home/section/continue/${game.slug}`} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Recommended */}
          {recommendedGames.length > 0 ? (
            <section>
              <SectionTitle title={t.recommendedLabel} actionHref="/account" actionLabel={t.readAll} trackingPath="/home/section-header/recommended" count={recommendedGames.length} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
                {recommendedGames.map((game) => (
                  <GameCard key={game.id} game={game} trackingPath={`/home/section/recommended/${game.slug}`} locale={locale} badge={recommendedReason ? `${t.recommendedReasonLabel}: ${recommendedReason}` : null} />
                ))}
              </div>
            </section>
          ) : null}

          <HomeThemeCatalog
            initialSections={homeThemeSections}
            initialHasMore={themeSectionsPage.hasMore}
            initialNextOffset={themeSectionsPage.nextOffset}
            initialCategory={initialCategory}
            initialQuery={initialQuery}
          />

          {/* Featured — first 2 large, rest normal */}
          <section>
            <SectionTitle title={t.featuredLabel} actionHref="/#catalogo" actionLabel={t.readAll} trackingPath="/home/section-header/featured" count={featuredGames.length} />
            <div className="grid grid-cols-2 gap-3 mb-3 stagger-children">
              {featuredGames.slice(0, 2).map((game) => (
                <GameCard key={game.id} game={game} trackingPath={`/home/section/featured/${game.slug}`} locale={locale} size="large" />
              ))}
            </div>
            {featuredGames.length > 2 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
                {featuredGames.slice(2).map((game) => (
                  <GameCard key={game.id} game={game} trackingPath={`/home/section/featured/${game.slug}`} locale={locale} />
                ))}
              </div>
            ) : null}
          </section>

          {/* Popular */}
          <section>
            <SectionTitle title={t.popularLabel} actionHref="/#catalogo" actionLabel={t.readAll} trackingPath="/home/section-header/popular" count={popularGames.length} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
              {popularGames.map((game) => (
                <GameCard key={game.id} game={game} trackingPath={`/home/section/popular/${game.slug}`} locale={locale} />
              ))}
            </div>
          </section>

          <AdSlot label={t.bannerMiddle} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_MIDDLE} />

          {/* In-feed ad */}
          <AdSlot label="Feed" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED} minHeight={100} />

          {/* New releases */}
          <section>
            <SectionTitle title={t.newLabel} actionHref="/#catalogo" actionLabel={t.readAll} trackingPath="/home/section-header/new" count={newGames.length} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
              {newGames.map((game) => (
                <GameCard key={game.id} game={game} trackingPath={`/home/section/new/${game.slug}`} locale={locale} />
              ))}
            </div>
          </section>

          {/* Pre-blog ad */}
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
        </div>
      </main>

      {/* ████ RIGHT SIDEBAR — Player / Ranking ████ */}
      <aside className="hidden xl:flex w-[320px] flex-none flex-col border-l border-slate-800/60 bg-slate-950/60 overflow-y-auto scrollbar-thin animate-slide-in-right">
        <div className="p-4 space-y-4">

          {/* Player card */}
          <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 animate-fade-in-up transition-all duration-200 hover:border-slate-700/80">
            {playerSession ? (
              <>
                <div className={`relative h-16 bg-gradient-to-r ${playerHubBannerGradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]" />
                  <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-slate-950/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                    {playerHubTag}
                  </span>
                </div>

                <div className="relative px-4 pb-4 pt-0">
                  <div className="flex items-end gap-3 -mt-5">
                    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-950 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.5)]">
                      {profile?.avatarUrl ? (
                        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${profile.avatarUrl}')` }} />
                      ) : (
                        getInitials(profile?.displayName ?? playerSession.user.displayName)
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pb-1">
                      <p className="truncate text-sm font-bold text-slate-100">
                        {profile?.displayName ?? playerSession.user.displayName}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Level {gamification?.level ?? 1}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>XP → Level {(gamification?.level ?? 1) + 1}</span>
                      <span>{Math.min(gamification?.progress.progressPercent ?? 0, 100)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-950/80">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all animate-progress-glow" style={{ width: `${Math.min(gamification?.progress.progressPercent ?? 0, 100)}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                      <p className="text-lg font-bold text-slate-100">{gamification?.level ?? 1}</p>
                      <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t.statsLevel}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                      <p className="text-lg font-bold text-slate-100">{gamification?.currentStreak ?? 0}</p>
                      <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t.statsStreak}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                      <p className="text-lg font-bold text-slate-100">{leaderboardPosition ? `#${leaderboardPosition}` : "--"}</p>
                      <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t.rankBadge}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                      <p className="text-lg font-bold text-slate-100">{gamification?.unreadNotifications ?? 0}</p>
                      <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t.statsNotifications}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {getPlayerSidebarQuickLabel(locale, "achievements")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                        {formatViews(gamification?.achievementCount ?? 0, locale)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {getPlayerSidebarQuickLabel(locale, "friends")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                        {formatViews(sidebarFriendCount, locale)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {getPlayerSidebarQuickLabel(locale, "favorites")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                        {formatViews(favorites.length, locale)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {getPlayerSidebarQuickLabel(locale, "played")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                        {formatViews(continuePlayingGames.length, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-shadow duration-300 hover:shadow-purple-500/50">
                    ?
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-100">Guest</p>
                    <p className="text-[11px] text-slate-500">{t.anonymousHint}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400">{t.anonymousHint}</p>
                  <TrackedLink href="/login?mode=register" trackingPath="/home/sidebar/register" className="block w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 py-2 text-center text-xs font-bold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                    {t.ctaRegister}
                  </TrackedLink>
                  <TrackedLink href="/login" trackingPath="/home/sidebar/login" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-center text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors">
                    Entrar
                  </TrackedLink>
                </div>
              </div>
            )}
          </div>

          <HomeAchievementsRail
            items={achievementRailItems}
            locale={locale}
            isAuthenticated={Boolean(playerSession)}
            unlockedCount={achievementRailItems.filter((achievement) => achievement.unlocked).length}
            title={t.achievementsLabel}
            subtitle={t.achievementsSubtitle}
            lockedLabel={t.achievementsLockedLabel}
            unlockedLabel={t.achievementsUnlockedLabel}
            guestCtaLabel={t.achievementsGuestCta}
            accountCtaLabel={t.achievementsAccountCta}
          />

          {/* Ranking */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">🏆 {t.rankingLabel}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{t.rankingSubtitle}</p>
              </div>
              {topPlayers.length > 0 ? (
                <span className="shrink-0 self-start rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
                  Top {TARGET_LEADERBOARD_SIZE}
                </span>
              ) : null}
            </div>

            {topPlayers.length > 0 ? (
              <div className="space-y-3">
                <div className={`grid ${podiumGridClassName} items-end gap-3 pt-2`}>
                  {podiumOrder.map((podiumIndex) => {
                    const player = podiumPlayers[podiumIndex];

                    if (!player) {
                      return null;
                    }

                    const styles = PODIUM_CARD_STYLES[podiumIndex];
                    const seal = LEADERBOARD_SEALS[podiumIndex];
                    const isFeaturedLeader = podiumIndex === 0;
                    const bannerGradient = getLeaderboardBannerGradient(
                      player.profileTheme,
                      player.preferredCategories,
                    );
                    const bannerTag = getLeaderboardProfileTag(locale, player.preferredCategories);

                    return (
                      <div
                        key={player.id}
                        className={`relative rounded-[20px] border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 ${styles.card} ${isFeaturedLeader ? "col-span-2" : ""}`}
                      >
                        <div className="leaderboard-seal-glint absolute left-2.5 top-2.5 z-10 h-10 w-10 isolate overflow-hidden drop-shadow-[0_6px_12px_rgba(2,6,23,0.4)]">
                          <Image
                            src={seal.src}
                            alt={seal.alt}
                            width={40}
                            height={40}
                            sizes="40px"
                            className="h-full w-full object-contain"
                          />
                          <span aria-hidden className="leaderboard-seal-glint-line" />
                        </div>

                        {isFeaturedLeader ? (
                          <div className="overflow-hidden rounded-[18px] border border-white/8 bg-slate-950/40">
                            <div className={`relative h-12 bg-gradient-to-r ${bannerGradient}`}>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%)]" />
                              <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-slate-950/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                                {bannerTag}
                              </span>
                            </div>

                            <div className="relative px-3 pb-3 pt-0">
                              <div className="flex items-end gap-3 -mt-4">
                                <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-950 text-[11px] font-bold shadow-[0_10px_26px_rgba(2,6,23,0.42)] ${styles.avatar}`}>
                                  {player.avatarUrl ? (
                                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                                  ) : (
                                    getInitials(player.displayName)
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 pb-1 text-left">
                                  <p className="truncate text-[14px] font-bold leading-tight text-slate-50">
                                    {player.displayName}
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-400">Lv.{player.level} • {player.currentStreak}🔥 {getLeaderboardStreakLabel(locale)}</p>
                                </div>

                                <div className="pb-1 text-right">
                                  <p className={`text-lg font-bold tabular-nums ${styles.score}`}>
                                    {formatViews(player.xp, locale)}
                                  </p>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/75">XP</p>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/65 px-3 py-2 text-left">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {getLeaderboardStatLabel(locale, "achievements")}
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                                    {formatViews(player.achievementCount, locale)}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/65 px-3 py-2 text-left">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {getLeaderboardStatLabel(locale, "friends")}
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                                    {formatViews(player.friendCount, locale)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center pt-7 text-center">
                            <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border text-[11px] font-bold ${styles.avatar}`}>
                              {player.avatarUrl ? (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                              ) : (
                                getInitials(player.displayName)
                              )}
                            </div>

                            <div className="mt-2 min-h-[2rem] w-full">
                              <p className="truncate text-[12px] font-bold leading-tight text-slate-50">
                                {player.displayName}
                              </p>
                            </div>

                            <div className="mt-2 space-y-0.5">
                              <p className={`text-[13px] font-bold tabular-nums ${styles.score}`}>
                                {formatViews(player.xp, locale)} XP
                              </p>
                              <p className="text-[10px] text-slate-500">Lv.{player.level} • {player.currentStreak}🔥</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {remainingLeaderboardEntries.length > 0 ? (
                  <div className="border-t border-slate-800/80 pt-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Posições 4 a {TARGET_LEADERBOARD_SIZE}
                      </p>
                      {remainingLeaderboardEntries.length > 4 ? (
                        <span className="text-[10px] text-slate-500">Role para ver mais</span>
                      ) : null}
                    </div>
                    <div className="max-h-[212px] space-y-1.5 overflow-y-scroll pr-1 scrollbar-thin stagger-children">
                      {remainingLeaderboardEntries.map(({ rank, player }) => {
                        const isEmptySlot = !player;

                        return (
                          <div key={player?.id ?? `leaderboard-slot-${rank}`} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 animate-fade-in-up ${isEmptySlot ? "border border-dashed border-slate-800/90 bg-slate-950/35" : "hover:bg-slate-800/50 hover:scale-[1.01]"}`}>
                            <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[10px] font-bold ${isEmptySlot ? "border-slate-800 bg-slate-950/80 text-slate-500" : "border-slate-700 bg-slate-950 text-slate-400"}`}>
                              {rank}
                            </span>
                            <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border text-[10px] font-bold flex-none ${isEmptySlot ? "border-slate-800 bg-slate-950/70 text-slate-500" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
                              {!isEmptySlot && player.avatarUrl ? (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                              ) : (
                                isEmptySlot ? "+" : getInitials(player.displayName)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {isEmptySlot ? (
                                <>
                                  <p className="truncate text-[12px] font-semibold text-slate-400 leading-tight">Vaga aberta no ranking</p>
                                  <p className="text-[9px] text-slate-600 leading-tight">Novos jogadores aparecem aqui conforme acumulam XP.</p>
                                </>
                              ) : (
                                <>
                                  <p className="truncate text-[12px] font-bold text-slate-100 leading-tight">{player.displayName}</p>
                                  <p className="text-[9px] text-slate-500 leading-tight">Lv.{player.level} • {formatViews(player.xp, locale)} XP • {player.currentStreak}🔥</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">{t.rankingEmpty}</p>
            )}
          </div>

          {/* Sidebar ad */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
            <AdSlot label="Sidebar" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} minHeight={250} />
          </div>

          {playerSession ? (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up transition-all duration-200 hover:border-emerald-400/20 animate-shimmer">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] uppercase tracking-widest text-emerald-300/80 font-bold">{t.missionLabel}</p>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{missionCard.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{missionCard.description}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{missionCard.progressLabel}</span>
                  <span>{missionCard.progressValue}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                </div>
              </div>
              <TrackedLink href={missionCard.href} trackingPath="/home/mission/action" className="block w-full rounded-lg bg-emerald-400/10 border border-emerald-400/20 py-2 text-center text-xs font-semibold text-emerald-200 transition-all duration-200 hover:bg-emerald-400/20 hover:shadow-[0_0_16px_rgba(52,211,153,0.15)] hover:scale-[1.01] active:scale-[0.98]">
                {missionCard.ctaLabel}
              </TrackedLink>
            </div>
          ) : null}

          {/* Friend leaderboard */}
          {friendLeaderboard.length > 1 && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-bold">👥 Ranking entre amigos</p>
              <div className="space-y-1 stagger-children">
                {friendLeaderboard.map((player, index) => {
                  const isMe = "isCurrentUser" in player && player.isCurrentUser;
                  return (
                    <div key={player.id} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:bg-slate-800/50 animate-fade-in-up ${isMe ? "bg-cyan-400/10 border border-cyan-400/20" : ""}`}>
                      <span className="w-5 flex-none text-center text-xs font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 flex-none">
                        {player.avatarUrl ? (
                          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                        ) : (
                          getInitials(player.displayName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[11px] font-semibold leading-tight ${isMe ? "text-cyan-200" : "text-slate-200"}`}>
                          {player.displayName} {isMe ? "(você)" : ""}
                        </p>
                        <p className="text-[9px] text-slate-500 leading-tight">Lv.{player.level} • {player.xp} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Taste profile summary */}
          {playerSession && tasteProfile?.recommendationSummary ? (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-purple-300/80 font-bold">Seu perfil</p>
              <p className="text-xs text-slate-400 leading-relaxed">{tasteProfile.recommendationSummary}</p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
