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
import { getHomeTexts } from "@/lib/home-content";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AdSlot } from "./AdSlot";
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

export async function PlayerSidebar() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const t = getHomeTexts(locale);

  const [
    topPlayers,
    profile,
    gamification,
    favorites,
    historyEntries,
    leaderboardPosition,
    friendLeaderboard,
    tasteProfile,
  ] = await Promise.all([
    listTopPlayers(10),
    playerSession ? getPlayerProfile(playerSession.user.id) : Promise.resolve(null),
    playerSession ? getPlayerGamificationOverview(playerSession.user.id) : Promise.resolve(null),
    playerSession ? listFavoriteGames(playerSession.user.id, 24) : Promise.resolve([]),
    playerSession ? listRecentlyPlayed(playerSession.user.id, 8) : Promise.resolve([]),
    playerSession ? getPlayerLeaderboardPosition(playerSession.user.id) : Promise.resolve(null),
    playerSession ? listFriendLeaderboard(playerSession.user.id) : Promise.resolve([]),
    playerSession ? getPlayerTasteProfile(playerSession.user.id) : Promise.resolve(null),
  ]);

  const continuePlayingGames = historyEntries.map((entry) => entry.game);
  const missionCard = buildDailyMission({
    locale,
    isAuthenticated: Boolean(playerSession),
    mission: gamification?.dailyMission ?? null,
  });

  return (
    <div className="p-4 space-y-4">
      {/* Player card */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up transition-all duration-200 hover:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-shadow duration-300 hover:shadow-purple-500/50">
            {profile ? getInitials(profile.displayName) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-100">
              {profile?.displayName ?? (playerSession ? playerSession.user.displayName : "Guest")}
            </p>
            <p className="text-[11px] text-slate-500">
              {playerSession ? `Level ${gamification?.level ?? 1}` : t.anonymousHint}
            </p>
          </div>
        </div>

        {playerSession ? (
          <>
            {/* XP bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>XP → Level {(gamification?.level ?? 1) + 1}</span>
                <span>{Math.min(gamification?.progress.progressPercent ?? 0, 100)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all animate-progress-glow"
                  style={{ width: `${Math.min(gamification?.progress.progressPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-slate-800/50 py-2">
                <p className="text-lg font-bold text-slate-100">{gamification?.level ?? 1}</p>
                <p className="text-[9px] uppercase text-slate-500">{t.statsLevel}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 py-2">
                <p className="text-lg font-bold text-slate-100">{gamification?.currentStreak ?? 0}</p>
                <p className="text-[9px] uppercase text-slate-500">{t.statsStreak}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 py-2">
                <p className="text-lg font-bold text-slate-100">{leaderboardPosition ? `#${leaderboardPosition}` : "--"}</p>
                <p className="text-[9px] uppercase text-slate-500">{t.rankBadge}</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 py-2">
                <p className="text-lg font-bold text-slate-100">{gamification?.unreadNotifications ?? 0}</p>
                <p className="text-[9px] uppercase text-slate-500">{t.statsNotifications}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-slate-800/30 px-3 py-2 text-center">
                <p className="text-base font-bold text-slate-100">{favorites.length}</p>
                <p className="text-[10px] text-slate-500">Favoritos</p>
              </div>
              <div className="flex-1 rounded-lg bg-slate-800/30 px-3 py-2 text-center">
                <p className="text-base font-bold text-slate-100">{continuePlayingGames.length}</p>
                <p className="text-[10px] text-slate-500">Jogados</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">{t.anonymousHint}</p>
            <TrackedLink
              href="/login?mode=register"
              trackingPath="/home/sidebar/register"
              className="block w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 py-2 text-center text-xs font-bold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.ctaRegister}
            </TrackedLink>
            <TrackedLink
              href="/login"
              trackingPath="/home/sidebar/login"
              className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-center text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
            >
              Entrar
            </TrackedLink>
          </div>
        )}
      </div>

      {/* Nitro Premium CTA */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-slate-900 to-slate-900 p-4 shadow-[0_8px_32px_rgba(168,85,247,0.15)] animate-fade-in-up">
        <div className="absolute top-0 right-0 p-2 opacity-20">
          <span className="text-2xl">⭐</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Monetização</p>
        <h3 className="mt-1 text-sm font-bold text-white">Arcade Nitro</h3>
        <p className="mt-1 text-[11px] text-slate-400 leading-tight">
          Remova anúncios, jogue sem limites e ganhe XP em dobro.
        </p>
        <TrackedLink
          href="/nitro"
          trackingPath="/home/sidebar/nitro"
          className="mt-3 block w-full rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500 py-2 text-center text-xs font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
        >
          Ver Planos ⭐
        </TrackedLink>
      </div>

      {/* Daily mission */}
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
        <TrackedLink
          href={missionCard.href}
          trackingPath={missionCard.variant === "guest" ? "/home/guest/action" : "/home/mission/action"}
          className="block w-full rounded-lg bg-emerald-400/10 border border-emerald-400/20 py-2 text-center text-xs font-semibold text-emerald-200 transition-all duration-200 hover:bg-emerald-400/20 hover:shadow-[0_0_16px_rgba(52,211,153,0.15)] hover:scale-[1.01] active:scale-[0.98]"
        >
          {missionCard.ctaLabel}
        </TrackedLink>
      </div>

      {/* Ranking */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
        <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">🏆 {t.rankingLabel}</p>
        <div className="space-y-1 stagger-children">
          {topPlayers.length > 0 ? (
            topPlayers.map((player, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal = medals[index] ?? null;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:bg-slate-800/50 hover:scale-[1.01] animate-fade-in-up ${index < 3 ? "bg-amber-400/5 border border-amber-400/10 hover:border-amber-400/25" : ""}`}
                >
                  <span className="w-5 flex-none text-center text-xs font-bold text-slate-400">
                    {medal ?? `${index + 1}`}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 flex-none">
                    {player.avatarUrl ? (
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                    ) : (
                      getInitials(player.displayName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-200 leading-tight">{player.displayName}</p>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      Lv.{player.level} • {formatViews(player.xp, locale)} XP • {player.currentStreak}🔥
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 py-2">{t.rankingEmpty}</p>
          )}
        </div>
      </div>

      {/* Sidebar ad */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
        <AdSlot label="Sidebar" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} minHeight={250} />
      </div>

      {/* Friend leaderboard */}
      {friendLeaderboard.length > 1 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
          <p className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-bold">👥 Ranking entre amigos</p>
          <div className="space-y-1 stagger-children">
            {friendLeaderboard.map((player, index) => {
              const isMe = "isCurrentUser" in player && player.isCurrentUser;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:bg-slate-800/50 animate-fade-in-up ${isMe ? "bg-cyan-400/10 border border-cyan-400/20" : ""}`}
                >
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
  );
}
