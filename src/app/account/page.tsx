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

type FavoriteEntry = Awaited<ReturnType<typeof listFavoriteGames>>[number];
type HistoryEntry = Awaited<ReturnType<typeof listRecentlyPlayed>>[number];
type GamificationOverview = NonNullable<Awaited<ReturnType<typeof getPlayerGamificationOverview>>>;
type DailyMissionEntry = NonNullable<GamificationOverview["dailyMission"]>;
type PanelTone = "cyan" | "amber" | "emerald" | "fuchsia";

const ACHIEVEMENT_SHOWCASE_ORDER = new Map(
  DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition, index) => [definition.key, index]),
);

const PANEL_TONE_STYLES: Record<
  PanelTone,
  { dot: string; eyebrow: string; badge: string }
> = {
  cyan: {
    dot: "bg-cyan-400",
    eyebrow: "text-cyan-300/80",
    badge: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  },
  amber: {
    dot: "bg-amber-400",
    eyebrow: "text-amber-300/80",
    badge: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  },
  emerald: {
    dot: "bg-emerald-400",
    eyebrow: "text-emerald-300/80",
    badge: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  },
  fuchsia: {
    dot: "bg-fuchsia-400",
    eyebrow: "text-fuchsia-300/80",
    badge: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100",
  },
};

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

function CollapsiblePanel({
  title,
  subtitle,
  badge,
  tone = "cyan",
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  tone?: PanelTone;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const toneStyles = PANEL_TONE_STYLES[tone];

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-slate-800/70 bg-slate-950/85 shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${toneStyles.dot}`} />
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${toneStyles.eyebrow}`}>
              {title}
            </p>
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 pl-3">
          {badge ? (
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${toneStyles.badge}`}>
              {badge}
            </span>
          ) : null}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 transition-colors group-open:border-slate-500 group-open:text-slate-100">
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">−</span>
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-800/70 px-4 py-4">{children}</div>
    </details>
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_340px]">
        <main className="space-y-5">
          <header className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90 shadow-[0_20px_50px_rgba(2,6,23,0.32)]">
            <div className="h-24 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.24),transparent_35%),linear-gradient(90deg,rgba(12,74,110,0.58),rgba(30,41,59,0.94),rgba(88,28,135,0.46))]" />
            <div className="relative px-5 pb-5 md:px-6 md:pb-6">
              <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex min-w-0 items-end gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-950 bg-gradient-to-br from-cyan-500 via-sky-500 to-fuchsia-500 text-xl font-bold text-white shadow-[0_12px_30px_rgba(8,145,178,0.28)]"
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
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">
                      Painel do jogador
                    </p>
                    <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
                      {profile.displayName}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>{profile.email}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>Conta desde {memberSince}</span>
                      {gamification ? (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <span className="font-medium text-amber-300">Lv. {gamification.level}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
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

                <form action={logout}>
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-300"
                  >
                    Sair da conta
                  </button>
                </form>
              </div>

              {gamification ? (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                    <span>Progresso do nível atual</span>
                    <span>
                      {gamification.progress.progressPercent}% · {gamification.progress.progressInLevel}/
                      {gamification.progress.neededInLevel} XP
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400"
                      style={{ width: `${gamification.progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/85 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Nível</p>
              <p className="mt-1 text-2xl font-semibold text-white tabular-nums">{gamification?.level ?? 1}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/85 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">XP total</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-300 tabular-nums">{gamification?.xp.toLocaleString(locale) ?? "0"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/85 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Streak</p>
              <p className="mt-1 text-2xl font-semibold text-orange-300 tabular-nums">{gamification?.currentStreak ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/85 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Favoritos</p>
              <p className="mt-1 text-2xl font-semibold text-fuchsia-200 tabular-nums">{favorites.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/85 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recentes</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300 tabular-nums">{history.length}</p>
            </div>
          </section>

          <CollapsiblePanel
            title="Perfil e preferências"
            subtitle="Nome, avatar, bio e categorias principais em um único compartimento."
            badge="Essencial"
            tone="cyan"
          >
            <AccountProfileForm initialProfile={profile} categories={categories} variant="embedded" />
          </CollapsiblePanel>

          {gamification ? (
            <CollapsiblePanel
              title="Missão diária"
              subtitle={dailyMissionCard?.title ?? "Continue a progressão de hoje."}
              badge={`${currentMissionProgressPercent}%`}
              tone="emerald"
              defaultOpen
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-50">{dailyMissionCard?.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {dailyMissionCard?.description}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{dailyMissionCard?.progressLabel}</span>
                      <span>{dailyMissionCard?.progressValue}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
                        style={{
                          width: `${Math.max(
                            currentMissionProgressPercent,
                            gamification.dailyMission?.progressCount ? 6 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        gamification.dailyMission?.isCompleted
                          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                          : "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                      }`}
                    >
                      {gamification.dailyMission?.isCompleted ? "Concluída" : "Ativa"}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300">
                      +{gamification.dailyMission?.rewardXp ?? 0} XP
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300">
                      {gamification.dailyMission?.isCompleted ? "Próxima janela" : "Renova"} {nextDailyMissionLabel}
                    </span>
                  </div>

                  {dailyMissionCard ? (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={dailyMissionCard.href}
                        className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/25"
                      >
                        {dailyMissionCard.ctaLabel}
                      </Link>
                      {gamification.dailyMission ? (
                        <Link
                          href={getDailyMissionHref(gamification.dailyMission.kind)}
                          className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
                        >
                          Abrir objetivo
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Resumo do ciclo
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="rounded-lg bg-slate-950/80 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <p className="mt-1 font-medium text-slate-100">
                        {gamification.activeToday ? "Você já esteve ativo hoje" : "Ainda falta registrar atividade hoje"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Meta</p>
                      <p className="mt-1 font-medium text-slate-100">
                        {gamification.dailyMission?.progressCount ?? 0}/{gamification.dailyMission?.targetCount ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Melhor streak</p>
                      <p className="mt-1 font-medium text-slate-100">{gamification.longestStreak} dias</p>
                    </div>
                  </div>
                </div>
              </div>

              {recentMissionHistory.length > 0 ? (
                <details className="group mt-4 rounded-xl border border-slate-800 bg-slate-900/45">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Últimos ciclos
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Histórico recente das missões anteriores.</p>
                    </div>
                    <span className="text-xs text-slate-400">{recentMissionHistory.length} itens</span>
                  </summary>

                  <div className="border-t border-slate-800 px-3 py-3">
                    <div className="space-y-2">
                      {recentMissionHistory.map((mission) => (
                        <div
                          key={mission.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              {getMissionHistoryTitle(mission)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {new Date(`${mission.dayToken}T00:00:00.000Z`).toLocaleDateString(locale)} · {mission.progressCount}/
                              {mission.targetCount} · +{mission.rewardXp} XP
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] ${
                                mission.isCompleted
                                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                  : "border-slate-700 bg-slate-900 text-slate-300"
                              }`}
                            >
                              {mission.isCompleted ? "Concluída" : "Incompleta"}
                            </span>
                            <Link
                              href={getDailyMissionHref(mission.kind)}
                              className="text-[11px] text-cyan-300 transition-colors hover:text-cyan-200"
                            >
                              Abrir
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}
            </CollapsiblePanel>
          ) : null}

          <CollapsiblePanel
            title="Biblioteca"
            subtitle="Favoritos e jogos recentes separados em menus próprios."
            badge={`${favorites.length + history.length} itens`}
            tone="amber"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <details open className="group rounded-xl border border-slate-800 bg-slate-900/45">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Favoritos</p>
                    <p className="mt-1 text-xs text-slate-500">Jogos salvos para voltar depois.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium text-cyan-100">
                    {favorites.length}
                  </span>
                </summary>

                <div className="border-t border-slate-800 px-3 py-3">
                  {favorites.length === 0 ? (
                    <p className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-5 text-sm text-slate-500">
                      Nenhum favorito salvo ainda. Use o coração nos jogos para montar sua biblioteca.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {favorites.map((entry: FavoriteEntry) => (
                        <Link
                          key={entry.id}
                          href={`/games/${entry.game.slug}`}
                          className="group/card overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 transition-colors hover:border-cyan-400/40"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={entry.game.thumbnail}
                              alt={entry.game.title}
                              fill
                              sizes="180px"
                              className="object-cover transition-transform group-hover/card:scale-105"
                            />
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[11px] font-medium text-slate-200 transition-colors group-hover/card:text-cyan-200">
                              {entry.game.title}
                            </p>
                            <p className="mt-0.5 text-[9px] text-slate-500">{entry.game.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/45">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">Recentes</p>
                    <p className="mt-1 text-xs text-slate-500">Últimos títulos jogados na conta.</p>
                  </div>
                  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-medium text-fuchsia-100">
                    {history.length}
                  </span>
                </summary>

                <div className="border-t border-slate-800 px-3 py-3">
                  {history.length === 0 ? (
                    <p className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-5 text-sm text-slate-500">
                      Abra um jogo com sua conta para começar a montar o histórico.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {history.map((entry: HistoryEntry) => (
                        <Link
                          key={entry.id}
                          href={`/games/${entry.game.slug}`}
                          className="group/card overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 transition-colors hover:border-fuchsia-400/40"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={entry.game.thumbnail}
                              alt={entry.game.title}
                              fill
                              sizes="180px"
                              className="object-cover transition-transform group-hover/card:scale-105"
                            />
                            <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[8px] text-slate-300 backdrop-blur-sm">
                              {entry.playCount}x
                            </span>
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[11px] font-medium text-slate-200 transition-colors group-hover/card:text-fuchsia-200">
                              {entry.game.title}
                            </p>
                            <p className="mt-0.5 text-[9px] text-slate-500">{entry.game.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </div>
          </CollapsiblePanel>

          {tasteProfile ? (
            <CollapsiblePanel
              title="Radar de gosto"
              subtitle="Leitura do seu comportamento para personalização do feed."
              badge={getTasteModeLabel(tasteProfile.mode)}
              tone="fuchsia"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-slate-400">
                    {tasteProfile.recommendationSummary}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-3 text-center">
                      <p className="text-lg font-semibold text-fuchsia-200 tabular-nums">{tasteProfile.favoriteCount}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Favoritos</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-3 text-center">
                      <p className="text-lg font-semibold text-cyan-300 tabular-nums">{tasteProfile.recentGameCount}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Recentes</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-3 text-center">
                      <p className="text-lg font-semibold text-emerald-300 tabular-nums">{tasteProfile.totalPlayCount}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Partidas</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <details open className="group rounded-xl border border-slate-800 bg-slate-900/45">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">Categorias</p>
                        <p className="mt-1 text-xs text-slate-500">Onde seu perfil pesa mais.</p>
                      </div>
                      <span className="text-xs text-slate-400">{tasteProfile.topCategories.length}</span>
                    </summary>
                    <div className="border-t border-slate-800 px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {tasteProfile.topCategories.length > 0 ? (
                          tasteProfile.topCategories.map((entry) => (
                            <span
                              key={entry.name}
                              className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] text-fuchsia-100"
                            >
                              {entry.name} · {entry.share.toLocaleString(locale, {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })}%
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Ainda faltam dados para consolidar categorias.</span>
                        )}
                      </div>
                    </div>
                  </details>

                  <details className="group rounded-xl border border-slate-800 bg-slate-900/45">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Tags</p>
                        <p className="mt-1 text-xs text-slate-500">Sinais finos que ajudam a recomendar jogos.</p>
                      </div>
                      <span className="text-xs text-slate-400">{tasteProfile.topTags.length}</span>
                    </summary>
                    <div className="border-t border-slate-800 px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {tasteProfile.topTags.length > 0 ? (
                          tasteProfile.topTags.map((entry) => (
                            <span
                              key={entry.name}
                              className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-100"
                            >
                              {entry.name} · {entry.score}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Ainda não há sinais suficientes para tags.</span>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </CollapsiblePanel>
          ) : null}

          {gamification ? (
            <CollapsiblePanel
              title="Conquistas"
              subtitle="Painel completo, mas guardado em um compartimento próprio."
              badge={`${gamification.achievementCount}/${achievementItems.length}`}
              tone="amber"
            >
              {achievementItems.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-900/55 px-4 py-5 text-sm text-slate-500">
                  Jogue, favorite e mantenha streak para começar a liberar conquistas.
                </p>
              ) : (
                <div className="max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                  <AchievementCollection
                    items={achievementItems}
                    locale={locale}
                    lockedLabel={homeTexts.achievementsLockedLabel}
                    unlockedLabel={homeTexts.achievementsUnlockedLabel}
                    layout="grid"
                  />
                </div>
              )}
            </CollapsiblePanel>
          ) : null}
        </main>

        <aside className="self-start space-y-4 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-slate-800/70 bg-slate-950/85 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.26)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Resumo rápido</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Bio</p>
                <p className="mt-1 text-sm text-slate-200">
                  {profile.bio.trim() ? "Perfil com bio preenchida" : "Bio ainda não configurada"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Preferências</p>
                <p className="mt-1 text-sm text-slate-200">
                  {profile.preferredCategories.length > 0
                    ? `${profile.preferredCategories.length} categoria(s) selecionada(s)`
                    : "Nenhuma categoria favorita ainda"}
                </p>
              </div>
              {gamification ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status de atividade</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {gamification.activeToday ? "Conta ativa hoje" : "Ainda sem atividade hoje"}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {gamification ? (
            <CollapsiblePanel
              title="Notificações"
              subtitle="Recados, alertas e eventos importantes da conta."
              badge={
                gamification.unreadNotifications > 0
                  ? `${gamification.unreadNotifications} novas`
                  : `${gamification.notifications.length} itens`
              }
              tone="cyan"
              defaultOpen={gamification.unreadNotifications > 0}
            >
              {gamification.unreadNotifications > 0 ? (
                <form action={markNotificationsRead} className="mb-3 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                  >
                    Marcar tudo como lido
                  </button>
                </form>
              ) : null}

              {gamification.notifications.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-900/55 px-4 py-5 text-sm text-slate-500">
                  Nenhuma notificação ainda. Avisos de level up, streak e conquistas aparecerão aqui.
                </p>
              ) : (
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {gamification.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-xl border p-3 ${
                        notification.isRead
                          ? "border-slate-800 bg-slate-900/45"
                          : "border-cyan-400/20 bg-cyan-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                            {notification.message}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {new Date(notification.createdAt).toLocaleDateString(locale)}
                        </span>
                      </div>

                      {notification.link ? (
                        <Link
                          href={notification.link}
                          className="mt-2 inline-flex text-[11px] text-cyan-300 transition-colors hover:text-cyan-200"
                        >
                          Abrir
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CollapsiblePanel>
          ) : null}

          <CollapsiblePanel
            title="Social"
            subtitle="Pedidos, lista de amigos e gerenciamento social."
            tone="cyan"
          >
            <div className="max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              <FriendsPanel />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Moedas e temas"
            subtitle="Saldo, skins de perfil e histórico da economia."
            tone="amber"
          >
            <div className="max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              <CoinsPanel />
            </div>
          </CollapsiblePanel>
        </aside>
      </div>
    </div>
  );
}
