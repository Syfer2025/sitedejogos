import { cookies } from "next/headers";

import { getPlayerGamificationOverview } from "@/data/gamificationStore";
import { listFriendLeaderboard } from "@/data/socialStore";
import {
  getPlayerLeaderboardPosition,
  getPlayerProfile,
  getPlayerTasteProfile,
  listFavoriteGames,
  listRecentlyPlayed,
  listTopPlayers,
} from "@/data/playerStore";
import { buildDailyMission } from "@/lib/daily-missions";
import { listAchievementDefinitions } from "@/data/achievementDefinitionsStore";
import {
  type AchievementEvaluationSnapshot,
  DEFAULT_ACHIEVEMENT_DEFINITIONS,
  getAchievementProgress,
} from "@/lib/gamification";
import { getDictionary, t } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME, resolveLocale, type Locale } from "@/lib/locale";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AdSlot } from "./AdSlot";
import { HomeAchievementsRail } from "./HomeAchievementsRail";
import { RewardedAdButton } from "./RewardedAdButton";
import { RightSidebarShell } from "./RightSidebarShell";
import { TrackedLink } from "./TrackedLink";

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
  return t(dict, "home.featuredLabel");
}

function getLeaderboardStatLabel(dict: any, type: "achievements" | "friends") {
  if (type === "achievements") return t(dict, "player.achievements");
  return t(dict, "player.friends");
}

function getPlayerHubTag(dict: any, categories: string[]) {
  const primaryCategory = categories[0];
  if (primaryCategory) return primaryCategory;
  return t(dict, "common.account");
}

function getPlayerSidebarQuickLabel(
  dict: any,
  type: "favorites" | "played" | "achievements" | "friends",
) {
  if (type === "favorites") return t(dict, "player.favorites");
  if (type === "played") return t(dict, "player.played");
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
  { src: "/leaderboard/place-1.png", alt: "1º" },
  { src: "/leaderboard/place-2.png", alt: "2º" },
  { src: "/leaderboard/place-3.png", alt: "3º" },
] as const;
const TARGET_LEADERBOARD_SIZE = 100;
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

export async function HomeRightSidebar() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const dict = await getDictionary(locale);

  const [
    topPlayers,
    profile,
    gamification,
    favorites,
    historyEntries,
    leaderboardPosition,
    friendLeaderboard,
    tasteProfile,
    achievementDefinitions,
  ] = await Promise.all([
    listTopPlayers(TARGET_LEADERBOARD_SIZE),
    playerSession ? getPlayerProfile(playerSession.user.id) : null,
    playerSession ? getPlayerGamificationOverview(playerSession.user.id) : null,
    playerSession ? listFavoriteGames(playerSession.user.id, 24) : [],
    playerSession ? listRecentlyPlayed(playerSession.user.id, 8) : [],
    playerSession ? getPlayerLeaderboardPosition(playerSession.user.id) : null,
    playerSession ? listFriendLeaderboard(playerSession.user.id) : [],
    playerSession ? getPlayerTasteProfile(playerSession.user.id) : null,
    listAchievementDefinitions(),
  ]);

  const continuePlayingGames = historyEntries.map((entry) => entry.game);
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

  return (
    <RightSidebarShell>
    <aside className="flex flex-col flex-1 min-h-0 min-w-0 border-l border-slate-800/60 bg-slate-950/60 overflow-y-auto scrollbar-thin">
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
                      {t(dict, "player.levelLabel", { level: gamification?.level ?? 1 })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{t(dict, "player.levelUp", { level: (gamification?.level ?? 1) + 1 })}</span>
                    <span>{Math.min(gamification?.progress.progressPercent ?? 0, 100)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-950/80">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all animate-progress-glow" style={{ width: `${Math.min(gamification?.progress.progressPercent ?? 0, 100)}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                    <p className="text-lg font-bold text-slate-100">{gamification?.level ?? 1}</p>
                    <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t(dict, "player.level")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                    <p className="text-lg font-bold text-slate-100">{gamification?.currentStreak ?? 0}</p>
                    <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t(dict, "player.streak")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                    <p className="text-lg font-bold text-slate-100">{leaderboardPosition ? `#${leaderboardPosition}` : "--"}</p>
                    <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t(dict, "home.rankingLabel")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-1 py-2">
                    <p className="text-lg font-bold text-slate-100">{gamification?.unreadNotifications ?? 0}</p>
                    <p className="text-[8px] font-medium leading-tight text-slate-500 [overflow-wrap:anywhere]">{t(dict, "player.notifications")}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {getPlayerSidebarQuickLabel(dict, "achievements")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                      {formatViews(gamification?.achievementCount ?? 0, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {getPlayerSidebarQuickLabel(dict, "friends")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                      {formatViews(sidebarFriendCount, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {getPlayerSidebarQuickLabel(dict, "favorites")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-100 tabular-nums">
                      {formatViews(favorites.length, locale)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {getPlayerSidebarQuickLabel(dict, "played")}
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
                  <p className="truncate text-sm font-bold text-slate-100">{t(dict, "player.guestName")}</p>
                  <p className="text-[11px] text-slate-500">{t(dict, "home.anonymousHint")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <TrackedLink href="/login?mode=register" trackingPath="/home/sidebar/register" className="block w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 py-2 text-center text-xs font-bold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                  {t(dict, "common.register")}
                </TrackedLink>
                <TrackedLink href="/login" trackingPath="/home/sidebar/login" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-center text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors">
                  {t(dict, "common.login")}
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
          title={t(dict, "player.achievements")}
          subtitle={t(dict, "player.achievementsSubtitle")}
          lockedLabel={t(dict, "player.locked")}
          unlockedLabel={t(dict, "player.unlocked")}
          guestCtaLabel={t(dict, "auth.registerSubtitle")}
          accountCtaLabel={t(dict, "player.achievementsSubtitle")}
        />

        {/* Ranking */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">🏆 {t(dict, "home.rankingLabel")}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{t(dict, "home.rankingSubtitle")}</p>
            </div>
            {topPlayers.length > 0 ? (
              <span className="shrink-0 self-start rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
                Top {TARGET_LEADERBOARD_SIZE}
              </span>
            ) : null}
          </div>

          {topPlayers.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-2 pt-2">
                {podiumPlayers.map((player, index) => {
                  if (!player) return null;

                  const styles = PODIUM_CARD_STYLES[index];
                  const seal = LEADERBOARD_SEALS[index];
                  const bannerGradient = getLeaderboardBannerGradient(
                    player.profileTheme,
                    player.preferredCategories,
                  );
                  const bannerTag = getLeaderboardProfileTag(dict, player.preferredCategories);

                  return (
                    <div
                      key={player.id}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${styles.card}`}
                    >
                      {/* Banner estilo Discord */}
                      <div className={`relative h-16 bg-gradient-to-r ${bannerGradient}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%)]" />
                        <span className="absolute right-3 top-2 rounded-full border border-white/15 bg-slate-950/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                          {bannerTag}
                        </span>
                        <div className="absolute left-3 -bottom-6 flex items-end gap-2">
                          <div className="relative h-12 w-12 flex-none">
                            <div className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-950 text-[11px] font-bold shadow-[0_10px_24px_rgba(2,6,23,0.8)] ${styles.avatar}`}>
                              {player.avatarUrl ? (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                              ) : (
                                getInitials(player.displayName)
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-7 pb-3 px-3">
                          <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold leading-tight text-slate-50">
                              {player.displayName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-300/90">
                              <span>
                                Lv.{player.level} • {player.currentStreak}🔥 {t(dict, "player.streak")}
                              </span>
                              <img
                                src={seal.src}
                                alt={seal.alt}
                                width={20}
                                height={20}
                                className="h-4 w-4 object-contain drop-shadow-[0_4px_8px_rgba(2,6,23,0.7)]"
                              />
                            </div>
                          </div>
                          <div className="text-right flex-none">
                            <p className={`text-sm font-bold tabular-nums ${styles.score}`}>
                              {formatViews(player.xp, locale)} XP
                            </p>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                              {index + 1}º lugar
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {remainingLeaderboardEntries.length > 0 ? (
                <div className="border-t border-slate-800/80 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t(dict, "player.rankingRange", { start: 4, end: TARGET_LEADERBOARD_SIZE })}
                    </p>
                  </div>
                  <div className="max-h-[400px] space-y-1.5 overflow-y-scroll pr-1 scrollbar-thin stagger-children">
                    {remainingLeaderboardEntries.map(({ rank, player }) => {
                      return (
                        <div key={player?.id ?? `leaderboard-slot-${rank}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 animate-fade-in-up hover:bg-slate-800/40">
                          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[10px] font-bold text-slate-300">
                            {rank}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 flex-none">
                            {player && player.avatarUrl ? (
                              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                            ) : player ? (
                              getInitials(player.displayName)
                            ) : (
                              "+"
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {player ? (
                              <>
                                <p className="truncate text-[12px] font-semibold text-slate-100 leading-tight">{player.displayName}</p>
                                <p className="text-[9px] text-slate-500 leading-tight">Lv.{player.level} • {formatViews(player.xp, locale)} XP</p>
                              </>
                            ) : (
                              <>
                                <p className="truncate text-[12px] font-semibold text-slate-400 leading-tight">{t(dict, "player.rankingEmptySlot")}</p>
                                <p className="text-[9px] text-slate-600 leading-tight">{t(dict, "player.rankingEmptySlotHint")}</p>
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
            <p className="text-xs text-slate-500 py-2">{t(dict, "home.empty")}</p>
          )}
        </div>

        {/* Rewarded Ad CTA */}
        {playerSession && (
          <div className="animate-fade-in-up transition-all duration-300">
            <RewardedAdButton isPremium={playerSession.user.isPremium} />
          </div>
        )}

        {/* Sidebar ad */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden sticky top-[104px] z-10 w-full mb-4">
          <AdSlot label="Sidebar" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} minHeight={600} adFormat="sticky" isPremium={playerSession?.user.isPremium} />
        </div>

        {/* Friend leaderboard */}
        {friendLeaderboard.length > 1 && (
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
            <p className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-bold">👥 {t(dict, "player.friendRanking")}</p>
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
                        {player.displayName} {isMe ? `(${t(dict, "player.you")})` : ""}
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
            <p className="text-[10px] uppercase tracking-widest text-purple-300/80 font-bold">{t(dict, "game.about")}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{tasteProfile.recommendationSummary}</p>
          </div>
        ) : null}
      </div>
    </aside>
    </RightSidebarShell>
  );
}
