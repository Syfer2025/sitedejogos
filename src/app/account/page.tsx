import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { listAchievementDefinitions } from "@/data/achievementDefinitionsStore";
import {
  getPlayerGamificationOverview,
  markAllPlayerNotificationsAsRead,
} from "@/data/gamificationStore";
import { listCategories } from "@/data/gamesStore";
import {
  buildDailyMission as buildDailyMissionCard,
  getDailyMissionHref,
} from "@/lib/daily-missions";
import {
  DEFAULT_ACHIEVEMENT_DEFINITIONS,
  getAchievementProgress,
} from "@/lib/gamification";
import { getHomeTexts } from "@/lib/home-content";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";
import {
  getPlayerProfile,
  getPlayerTasteProfile,
  listFavoriteGames,
  listRecentlyPlayed,
} from "@/data/playerStore";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AccountProfileForm } from "../components/AccountProfileForm";
import { FriendsPanel } from "../components/FriendsPanel";
import { CoinsPanel } from "../components/CoinsPanel";
import { AchievementCollection } from "../components/HomeAchievementsRail";

type FavoriteEntry = Awaited<ReturnType<typeof listFavoriteGames>>[number];
type HistoryEntry = Awaited<ReturnType<typeof listRecentlyPlayed>>[number];
type GamificationOverview = NonNullable<Awaited<ReturnType<typeof getPlayerGamificationOverview>>>;
type DailyMissionEntry = NonNullable<GamificationOverview["dailyMission"]>;

const ACHIEVEMENT_SHOWCASE_ORDER = new Map(
  DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition, index) => [definition.key, index]),
);

function getPlayerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getMissionHistoryTitle(mission: DailyMissionEntry) {
  if (mission.kind === "favorite_add") {
    return "Salvar favorito";
  }

  if (mission.kind === "profile_update") {
    return "Atualizar perfil";
  }

  return mission.targetCount > 1
    ? `Jogar ${mission.targetCount} partidas`
    : "Jogar hoje";
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const homeTexts = getHomeTexts(locale);
  const token = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const session = token ? await getPlayerSession(token) : null;

  if (!session) {
    redirect("/login?from=/account");
  }

  const [favorites, history, profile, categories, gamification, tasteProfile, achievementDefinitions] = await Promise.all([
    listFavoriteGames(session.user.id, 12),
    listRecentlyPlayed(session.user.id, 12),
    getPlayerProfile(session.user.id),
    listCategories(),
    getPlayerGamificationOverview(session.user.id),
    getPlayerTasteProfile(session.user.id),
    listAchievementDefinitions(),
  ]);

  if (!profile) {
    redirect("/login?from=/account");
  }

  const playerUserId = session.user.id;

  const playerInitials = getPlayerInitials(profile.displayName);
  const memberSince = new Date(profile.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const dailyMissionCard = gamification
    ? buildDailyMissionCard({
        locale: "pt-BR",
        isAuthenticated: true,
        mission: gamification.dailyMission,
      })
    : null;
  const currentMissionProgressPercent = gamification?.dailyMission
    ? Math.min(
        100,
        Math.round(
          (gamification.dailyMission.progressCount /
            Math.max(gamification.dailyMission.targetCount, 1)) *
            100,
        ),
      )
    : 0;
  const nextDailyMissionLabel = gamification
    ? new Date(gamification.nextDailyMissionAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const recentMissionHistory = gamification
    ? gamification.dailyMissionHistory
        .filter((mission) => mission.id !== gamification.dailyMission?.id)
        .slice(0, 4)
    : [];
  const unlockedAchievementKeys = new Set(gamification?.unlockedAchievementKeys ?? []);
  const achievementItems = gamification
    ? [...achievementDefinitions]
        .sort((left, right) => {
          const leftOrder = ACHIEVEMENT_SHOWCASE_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = ACHIEVEMENT_SHOWCASE_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;

          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }

          return left.createdAt.localeCompare(right.createdAt);
        })
        .map((definition) => {
          const progress = getAchievementProgress(definition, gamification.achievementSnapshot);

          return {
            ...definition,
            unlocked: unlockedAchievementKeys.has(definition.key),
            currentValue: progress.currentValue,
            targetValue: progress.targetValue,
            progressPercent: progress.progressPercent,
          };
        })
    : [];

  async function markNotificationsRead() {
    "use server";

    await markAllPlayerNotificationsAsRead(playerUserId);
  }

  async function logout() {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;

    if (token) {
      const { deletePlayerSession } = await import("@/lib/user-auth");
      await deletePlayerSession(token);
    }

    cookieStore.set(PLAYER_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    redirect("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-6">
      <section className="rounded-[28px] border border-slate-800 bg-[linear-gradient(135deg,rgba(8,145,178,0.18),rgba(15,23,42,0.92),rgba(8,47,73,0.65))] p-6 shadow-[0_0_70px_rgba(2,6,23,0.65)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-cyan-300/30 bg-slate-950/50 text-2xl font-semibold text-slate-50 shadow-[0_0_35px_rgba(8,145,178,0.18)]"
              style={
                profile.avatarUrl
                  ? {
                      backgroundImage: `url("${profile.avatarUrl}")`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            >
              {profile.avatarUrl ? null : playerInitials}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80">
                Minha conta
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-sm text-slate-300">{profile.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="rounded-full border border-slate-700/80 bg-slate-950/50 px-2 py-1">
                  Membro desde {memberSince}
                </span>
                {profile.preferredCategories.length > 0 ? (
                  profile.preferredCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-cyan-100"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-700/80 bg-slate-950/50 px-2 py-1">
                    Sem preferências definidas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="rounded-2xl border border-cyan-400/30 bg-slate-950/35 px-4 py-3">
              <p className="text-slate-400">Favoritos</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{favorites.length}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-slate-950/35 px-4 py-3">
              <p className="text-slate-400">Recentes</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{history.length}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-red-500/70 hover:text-red-200"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>

      <AccountProfileForm initialProfile={profile} categories={categories} />

      {tasteProfile ? (
        <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-300/80">
                Radar de gosto
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">
                Perfil em modo {tasteProfile.mode === "focused" ? "focado" : tasteProfile.mode === "hybrid" ? "híbrido" : "explorador"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                {tasteProfile.recommendationSummary}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Favoritos usados</p>
                  <p className="mt-2 text-2xl font-semibold text-fuchsia-200">
                    {tasteProfile.favoriteCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Jogos recentes</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-300">
                    {tasteProfile.recentGameCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Partidas somadas</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">
                    {tasteProfile.totalPlayCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-50">Categorias dominantes</h3>
                  <span className="text-[11px] text-slate-500">Peso atual</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tasteProfile.topCategories.length > 0 ? (
                    tasteProfile.topCategories.map((entry) => (
                      <span
                        key={entry.name}
                        className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] text-fuchsia-100"
                      >
                        {entry.name} • {entry.share.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      Defina preferências e jogue mais para consolidar sua trilha.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-50">Tags que mais puxam</h3>
                  <span className="text-[11px] text-slate-500">Sinais finos</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tasteProfile.topTags.length > 0 ? (
                    tasteProfile.topTags.map((entry) => (
                      <span
                        key={entry.name}
                        className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100"
                      >
                        {entry.name} • {entry.score}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      Ainda faltam sinais suficientes para refinar as tags do feed.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {gamification ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
                    Progresso do jogador
                  </p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">
                    Level {gamification.level} • {gamification.xp} XP
                  </h2>
                </div>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
                  {gamification.activeToday ? "Ativo hoje" : "Volte hoje para manter a streak"}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Streak atual</p>
                  <p className="mt-2 text-2xl font-semibold text-orange-300">
                    {gamification.currentStreak} dias
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Melhor streak</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-300">
                    {gamification.longestStreak} dias
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <p className="text-[11px] text-slate-500">Próximo nível</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">
                    {Math.max(gamification.progress.nextLevelXp - gamification.xp, 0)} XP
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {gamification.progress.progressInLevel} / {gamification.progress.neededInLevel} XP neste nível
                  </span>
                  <span>{gamification.progress.progressPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400"
                    style={{ width: `${gamification.progress.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">Trilha de conquistas</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    O mesmo painel da home, agora com visão completa da sua progressão e detalhes por conquista.
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {gamification.achievementCount}/{achievementItems.length} desbloqueada(s)
                </span>
              </div>

              {achievementItems.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
                  Jogue, favorite e volte em dias consecutivos para começar sua trilha de conquistas.
                </p>
              ) : (
                <AchievementCollection
                  items={achievementItems}
                  locale={locale}
                  lockedLabel={homeTexts.achievementsLockedLabel}
                  unlockedLabel={homeTexts.achievementsUnlockedLabel}
                  layout="grid"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                    Missão diária
                  </p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">
                    {dailyMissionCard?.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">{dailyMissionCard?.description}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    gamification.dailyMission?.isCompleted
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                      : "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                  }`}
                >
                  {gamification.dailyMission?.isCompleted ? "Concluída" : "Em andamento"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{dailyMissionCard?.progressLabel}</span>
                    <span>{dailyMissionCard?.progressValue}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400"
                      style={{
                        width: `${Math.max(
                          currentMissionProgressPercent,
                          gamification.dailyMission?.progressCount ? 6 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/55 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Recompensa</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">
                    +{gamification.dailyMission?.rewardXp ?? 0} XP
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  {gamification.dailyMission?.isCompleted ? "Próximo ciclo" : "Renovação"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-100">{nextDailyMissionLabel}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {gamification.dailyMission?.isCompleted
                    ? "Você fechou o objetivo de hoje. A próxima missão entra automaticamente no ciclo seguinte."
                    : "Ainda dá tempo de concluir a missão atual antes da virada do próximo ciclo."}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-50">Histórico recente</h3>
                {dailyMissionCard ? (
                  <Link
                    href={dailyMissionCard.href}
                    className="inline-flex items-center rounded-full border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-400 hover:bg-cyan-500/15"
                  >
                    {dailyMissionCard.ctaLabel}
                  </Link>
                ) : null}
              </div>

              {recentMissionHistory.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-4 text-sm text-slate-400">
                  Conclua alguns ciclos para começar a montar seu histórico de missões.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {recentMissionHistory.map((mission) => (
                    <div
                      key={mission.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {getMissionHistoryTitle(mission)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {new Date(`${mission.dayToken}T00:00:00.000Z`).toLocaleDateString("pt-BR")} • {mission.progressCount}/{mission.targetCount} • +{mission.rewardXp} XP
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] ${
                              mission.isCompleted
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                : "border-slate-700 bg-slate-950/60 text-slate-300"
                            }`}
                          >
                            {mission.isCompleted ? "Concluída" : "Incompleta"}
                          </span>
                          <Link
                            href={getDailyMissionHref(mission.kind)}
                            className="text-[10px] text-cyan-300 hover:text-cyan-200"
                          >
                            Abrir
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">Notificações do portal</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {gamification.unreadNotifications} não lida(s)
                  </p>
                </div>
                {gamification.unreadNotifications > 0 ? (
                  <form action={markNotificationsRead}>
                    <button
                      type="submit"
                      className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-cyan-100"
                    >
                      Marcar como lidas
                    </button>
                  </form>
                ) : null}
              </div>

              {gamification.notifications.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
                  As próximas ações vão gerar avisos de streak, level up e novas conquistas aqui.
                </p>
              ) : (
                <div className="space-y-3">
                  {gamification.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-2xl border p-4 ${
                        notification.isRead
                          ? "border-slate-800 bg-slate-900/45"
                          : "border-cyan-400/25 bg-cyan-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{notification.title}</p>
                          <p className="mt-1 text-[12px] text-slate-400">{notification.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(notification.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          className="mt-3 inline-flex text-[11px] text-cyan-300 hover:text-cyan-200"
                        >
                          Abrir
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Social & Economy ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">Social</p>
          <h2 className="mt-2 mb-4 text-lg font-semibold tracking-tight text-slate-50">Amigos</h2>
          <FriendsPanel />
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">Economia</p>
          <h2 className="mt-2 mb-4 text-lg font-semibold tracking-tight text-slate-50">Moedas & Temas</h2>
          <CoinsPanel />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Favoritos</h2>
            <Link href="/games" className="text-xs text-cyan-300 hover:text-cyan-200">
              Explorar mais jogos
            </Link>
          </div>

          {favorites.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
              Você ainda não salvou nenhum jogo. Abra um título e use o botão de favoritos.
            </p>
          ) : (
            <div className="space-y-3">
              {favorites.map((entry: FavoriteEntry) => (
                <Link
                  key={entry.id}
                  href={`/games/${entry.game.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-3 transition-colors hover:border-cyan-400/60"
                >
                  <div className="relative h-20 w-28 overflow-hidden rounded-xl">
                    <Image
                      src={entry.game.thumbnail}
                      alt={entry.game.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{entry.game.title}</p>
                    <p className="mt-1 text-[12px] text-slate-400 line-clamp-2">
                      {entry.game.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{entry.game.category}</span>
                      <span>•</span>
                      <span>{entry.createdAt.toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Jogados recentemente</h2>
            <span className="text-xs text-slate-500">Atualizado automaticamente</span>
          </div>

          {history.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
              Seu histórico aparecerá assim que você abrir um jogo com a conta conectada.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry: HistoryEntry) => (
                <Link
                  key={entry.id}
                  href={`/games/${entry.game.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-3 transition-colors hover:border-cyan-400/60"
                >
                  <div className="relative h-20 w-28 overflow-hidden rounded-xl">
                    <Image
                      src={entry.game.thumbnail}
                      alt={entry.game.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{entry.game.title}</p>
                    <p className="mt-1 text-[12px] text-slate-400 line-clamp-2">
                      {entry.game.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{entry.playCount} partida(s)</span>
                      <span>•</span>
                      <span>{entry.lastPlayedAt.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}