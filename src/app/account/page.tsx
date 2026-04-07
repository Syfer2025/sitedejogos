import type { ReactNode } from "react";

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
import { ProfileTabNav } from "../components/ProfileTabNav";

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

function getTasteModeLabel(mode: string) {
  if (mode === "focused") {
    return "Focado";
  }

  if (mode === "hybrid") {
    return "Híbrido";
  }

  return "Explorador";
}

/* ────────────────────── Stat Card ────────────────────── */
function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/80 px-4 py-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.3)] transition-all duration-300 hover:border-slate-700/80 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(2,6,23,0.4)]">
      <div className={`absolute inset-0 opacity-[0.06] bg-gradient-to-br ${gradient} transition-opacity duration-300 group-hover:opacity-[0.12]`} />
      <div className="relative flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-white tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Section Header ────────────────────── */
function SectionHeader({
  icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-lg">
          {icon}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
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
  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const dailyMissionCard = gamification
    ? buildDailyMissionCard({
        locale,
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
    ? new Date(gamification.nextDailyMissionAt).toLocaleString(locale, {
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
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      {/* ══════════ HERO HEADER ══════════ */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950/90 shadow-[0_20px_60px_rgba(2,6,23,0.35)] animate-fade-in-up">
        {/* Banner gradient */}
        <div className="h-28 bg-[radial-gradient(circle_at_20%_50%,rgba(34,211,238,0.22),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.2),transparent_40%),linear-gradient(90deg,rgba(12,74,110,0.5),rgba(30,41,59,0.9),rgba(88,28,135,0.4))]" />

        <div className="relative px-5 pb-6 md:px-8 md:pb-8">
          <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            {/* Avatar + info */}
            <div className="flex min-w-0 items-end gap-5">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-950 bg-gradient-to-br from-cyan-500 via-sky-500 to-fuchsia-500 text-2xl font-bold text-white shadow-[0_12px_36px_rgba(8,145,178,0.3)] transition-transform hover:scale-105"
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

              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-white">
                    {profile.displayName}
                  </h1>
                  {gamification && (
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                      Lv. {gamification.level}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{profile.email}</span>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <span>Desde {memberSince}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {profile.preferredCategories.length > 0 ? (
                    profile.preferredCategories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-medium text-cyan-100"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-0.5 text-[10px] text-slate-400">
                      Sem categorias favoritas definidas
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form action={logout} className="shrink-0">
              <button
                type="submit"
                className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:border-red-500/50 hover:text-red-300 hover:bg-red-950/20"
              >
                Sair da conta
              </button>
            </form>
          </div>

          {/* XP bar */}
          {gamification && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-500">Progresso do nível</span>
                <span className="text-slate-400 font-medium">
                  {gamification.progress.progressPercent}% · {gamification.progress.progressInLevel}/
                  {gamification.progress.neededInLevel} XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all duration-700 animate-progress-glow"
                  style={{ width: `${gamification.progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══════════ STAT CARDS ══════════ */}
      <section aria-label="Resumo rápido" className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 stagger-children">
        <StatCard label="Nível" value={gamification?.level ?? 1} icon="⚡" gradient="from-amber-400 to-orange-500" />
        <StatCard label="XP total" value={gamification?.xp.toLocaleString(locale) ?? "0"} icon="✨" gradient="from-cyan-400 to-blue-500" />
        <StatCard label="Streak" value={`${gamification?.currentStreak ?? 0}d`} icon="🔥" gradient="from-orange-400 to-red-500" />
        <StatCard label="Favoritos" value={favorites.length} icon="❤️" gradient="from-pink-400 to-fuchsia-500" />
        <StatCard label="Recentes" value={history.length} icon="🎮" gradient="from-emerald-400 to-teal-500" />
      </section>

      {/* ══════════ FULL-WIDTH TABBED CONTENT ══════════ */}
      <div className="mt-6">
        <ProfileTabNav
          notificationCount={gamification?.unreadNotifications ?? 0}
          /* ══ Tab: Carteira ══ */
          walletContent={
            <div className="animate-fade-in">
              <section className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/20 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="🪙"
                  title="Carteira"
                  subtitle="Saldo, temas e extrato de moedas."
                  badge={
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Loja
                    </span>
                  }
                />
                <div className="mt-5">
                  <CoinsPanel />
                </div>
              </section>
            </div>
          }
          /* ══ Tab: Social ══ */
          socialContent={
            <div className="animate-fade-in">
              <section className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/15 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="👥"
                  title="Social & Amigos"
                  subtitle="Gerencie seu círculo e acompanhe o progresso."
                  badge={
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      Comunidade
                    </span>
                  }
                />
                <div className="mt-5">
                  <FriendsPanel />
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  Adicione amigos por email para competir no ranking e acompanhar o progresso de cada um.
                </p>
              </section>
            </div>
          }
          /* ══ Tab: Missão (Daily Mission + Conquistas) ══ */
          missionContent={
            gamification ? (
              <div className="space-y-6 animate-fade-in">
                {/* Daily mission */}
                <section className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/15 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                  <SectionHeader
                    icon="🎯"
                    title="Missão Diária"
                    subtitle={dailyMissionCard?.title ?? "Continue a progressão de hoje."}
                    badge={
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        gamification.dailyMission?.isCompleted
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                      }`}>
                        {currentMissionProgressPercent}%
                      </span>
                    }
                  />

                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-50">{dailyMissionCard?.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">{dailyMissionCard?.description}</p>
                      </div>

                      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{dailyMissionCard?.progressLabel}</span>
                          <span className="font-medium">{dailyMissionCard?.progressValue}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 transition-all duration-500 animate-progress-glow"
                            style={{ width: `${Math.max(currentMissionProgressPercent, gamification.dailyMission?.progressCount ? 6 : 0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          gamification.dailyMission?.isCompleted
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                            : "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                        }`}>
                          {gamification.dailyMission?.isCompleted ? "✅ Concluída" : "⏳ Ativa"}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] text-slate-300">
                          +{gamification.dailyMission?.rewardXp ?? 0} XP
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] text-slate-300">
                          {gamification.dailyMission?.isCompleted ? "Próxima" : "Renova"} {nextDailyMissionLabel}
                        </span>
                      </div>

                      {dailyMissionCard && (
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={dailyMissionCard.href}
                            className="rounded-xl bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-500/25"
                          >
                            {dailyMissionCard.ctaLabel}
                          </Link>
                          {gamification.dailyMission && (
                            <Link
                              href={getDailyMissionHref(gamification.dailyMission.kind)}
                              className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-xs text-slate-300 transition-all hover:border-cyan-500/40 hover:text-cyan-200"
                            >
                              Abrir objetivo
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resumo do ciclo</p>
                      <div className="mt-3 space-y-2.5">
                        <div className="rounded-lg bg-slate-950/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                          <p className="mt-1 text-sm font-medium text-slate-100">{gamification.activeToday ? "✅ Ativo hoje" : "⏳ Sem atividade hoje"}</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Meta</p>
                          <p className="mt-1 text-sm font-medium text-slate-100">{gamification.dailyMission?.progressCount ?? 0}/{gamification.dailyMission?.targetCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/80 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Melhor streak</p>
                          <p className="mt-1 text-sm font-medium text-slate-100">{gamification.longestStreak} dias 🔥</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {recentMissionHistory.length > 0 && (
                    <details className="mt-5 group rounded-xl border border-slate-800 bg-slate-900/45">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Últimos ciclos</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Histórico das missões anteriores</p>
                        </div>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] text-slate-400">
                          {recentMissionHistory.length} itens
                        </span>
                      </summary>
                      <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                        {recentMissionHistory.map((mission) => (
                          <div key={mission.id} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-100">{getMissionHistoryTitle(mission)}</p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {new Date(`${mission.dayToken}T00:00:00.000Z`).toLocaleDateString(locale)} · {mission.progressCount}/{mission.targetCount} · +{mission.rewardXp} XP
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] ${mission.isCompleted ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
                                {mission.isCompleted ? "Concluída" : "Incompleta"}
                              </span>
                              <Link href={getDailyMissionHref(mission.kind)} className="text-[11px] text-cyan-300 transition-colors hover:text-cyan-200">Abrir</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </section>

                {/* Conquistas (inside Mission tab) */}
                {achievementItems.length > 0 && (
                  <section className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                    <SectionHeader
                      icon="🏆"
                      title="Conquistas"
                      subtitle="Desbloqueie achievements jogando e completando objetivos."
                      badge={
                        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {achievementItems.filter((a) => a.unlocked).length}/{achievementItems.length}
                        </span>
                      }
                    />
                    <div className="mt-5">
                      <AchievementCollection items={achievementItems} />
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="animate-fade-in rounded-2xl border border-slate-800/60 bg-slate-950/80 px-5 py-10 text-center">
                <span className="text-3xl">🎯</span>
                <p className="mt-3 text-sm text-slate-400">Jogue para desbloquear missões diárias.</p>
              </div>
            )
          }
          /* ══ Tab: Biblioteca (Favoritos + Recentes + Radar) ══ */
          libraryContent={
            <div className="space-y-6 animate-fade-in">
              {/* Favoritos */}
              <section className="rounded-2xl border border-pink-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-pink-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="❤️"
                  title="Favoritos"
                  subtitle="Jogos salvos para voltar depois."
                  badge={<span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-300">{favorites.length}</span>}
                />
                <div className="mt-5">
                  {favorites.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center">
                      <span className="text-2xl">💜</span>
                      <p className="mt-2 text-sm text-slate-400">Marque jogos como favoritos para encontrá-los aqui.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {favorites.map((entry: FavoriteEntry) => (
                        <Link key={entry.id} href={`/games/${entry.game.slug}`} className="group rounded-xl border border-slate-800 bg-slate-900/55 overflow-hidden transition-all hover:border-pink-500/30 hover:-translate-y-0.5">
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image src={entry.game.thumbnail} alt={entry.game.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                          <div className="p-2.5">
                            <p className="truncate text-sm font-medium text-slate-100">{entry.game.title}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{entry.game.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Recentes */}
              <section className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="🕹️"
                  title="Jogados recentemente"
                  subtitle="Seus últimos jogos."
                  badge={<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{history.length}</span>}
                />
                <div className="mt-5">
                  {history.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center">
                      <span className="text-2xl">🎮</span>
                      <p className="mt-2 text-sm text-slate-400">Jogue algo para ver seu histórico aqui.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {history.map((entry: HistoryEntry) => (
                        <Link key={entry.id} href={`/games/${entry.game.slug}`} className="group rounded-xl border border-slate-800 bg-slate-900/55 overflow-hidden transition-all hover:border-emerald-500/30 hover:-translate-y-0.5">
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image src={entry.game.thumbnail} alt={entry.game.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                          <div className="p-2.5">
                            <p className="truncate text-sm font-medium text-slate-100">{entry.game.title}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{entry.game.category} · {entry.playCount}× jogado</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Radar de gosto (inside Library tab) */}
              {tasteProfile ? (
                <section className="rounded-2xl border border-fuchsia-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-fuchsia-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                  <SectionHeader
                    icon="📡"
                    title="Radar de gosto"
                    subtitle="Seu perfil gerado com base no que joga e favorita."
                    badge={
                      <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">
                        {getTasteModeLabel(tasteProfile.mode)}
                      </span>
                    }
                  />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tasteProfile.topCategories.map((cat) => (
                      <div key={cat.name} className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-100">{cat.name}</p>
                          <span className="text-xs font-bold text-fuchsia-300">{Math.round(cat.score * 100)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-400" style={{ width: `${Math.round(cat.score * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {tasteProfile.topTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tasteProfile.topTags.map((tag) => (
                        <span key={tag.name} className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] text-fuchsia-200">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 px-5 py-8 text-center">
                  <span className="text-2xl">📡</span>
                  <p className="mt-3 text-sm text-slate-400">Jogue mais para gerar seu radar de gosto personalizado.</p>
                </div>
              )}
            </div>
          }
          /* ══ Tab: Perfil (Facebook-style) ══ */
          profileContent={
            <div className="animate-fade-in">
              <section className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="✏️"
                  title="Editar perfil"
                  subtitle="Personalize seu avatar, capa, bio e preferências."
                />
                <div className="mt-5">
                  <AccountProfileForm
                    initialProfile={{
                      displayName: profile.displayName,
                      email: profile.email,
                      avatarUrl: profile.avatarUrl,
                      coverUrl: profile.coverUrl,
                      bio: profile.bio,
                      preferredCategories: profile.preferredCategories,
                      unlockedAvatars: profile.unlockedAvatars,
                      unlockedCovers: profile.unlockedCovers,
                      coins: profile.coins,
                    }}
                    categories={categories}
                  />
                </div>
              </section>
            </div>
          }
          /* ══ Tab: Avisos (Notifications) ══ */
          notificationsContent={
            <div className="animate-fade-in">
              <section className="rounded-2xl border border-yellow-500/15 bg-gradient-to-br from-slate-950 via-slate-950 to-yellow-950/10 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.3)]">
                <SectionHeader
                  icon="🔔"
                  title="Notificações"
                  subtitle="Conquistas, streaks, e atualizações do sistema."
                  badge={
                    gamification && gamification.unreadNotifications > 0 ? (
                      <span className="rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        {gamification.unreadNotifications} novas
                      </span>
                    ) : undefined
                  }
                />

                {gamification && gamification.unreadNotifications > 0 && (
                  <form action={markNotificationsRead} className="mt-4">
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                    >
                      Marcar tudo como lido
                    </button>
                  </form>
                )}

                <div className="mt-5">
                  {!gamification || gamification.notifications.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center">
                      <span className="text-2xl">🔕</span>
                      <p className="mt-2 text-sm text-slate-400">Nenhuma notificação ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gamification.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-xl border p-4 transition-colors ${
                            notification.isRead
                              ? "border-slate-800 bg-slate-900/45"
                              : "border-yellow-400/20 bg-yellow-500/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100">{notification.title}</p>
                              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{notification.message}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-slate-500">
                              {new Date(notification.createdAt).toLocaleDateString(locale)}
                            </span>
                          </div>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="mt-2 inline-flex text-[11px] text-cyan-300 transition-colors hover:text-cyan-200"
                            >
                              Abrir →
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          }
        />
      </div>
    </div>
  );
}

