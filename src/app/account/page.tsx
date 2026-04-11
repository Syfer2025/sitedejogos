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
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";
import { getDictionary, t as tr } from "@/lib/i18n";
import {
  getPlayerProfile,
  getPlayerTasteProfile,
  listFavoriteGames,
  listRecentlyPlayed,
} from "@/data/playerStore";
import { prisma } from "@/lib/prisma";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { AccountProfileForm } from "../components/AccountProfileForm";
import { FriendsPanel } from "../components/FriendsPanel";
import { CoinsPanel } from "../components/CoinsPanel";
import { AchievementCollection } from "../components/HomeAchievementsRail";
import { ProfileSidebarNav, type ProfileTabKey } from "../components/ProfileSidebarNav";
import { ActivityFeed } from "../components/ActivityFeed";
import { AccountHeader } from "../components/AccountHeader";
import { Footer } from "../components/Footer";
import { TotpSetupFlow } from "../components/TotpSetupFlow";

type FavoriteEntry = Awaited<ReturnType<typeof listFavoriteGames>>[number];
type HistoryEntry = Awaited<ReturnType<typeof listRecentlyPlayed>>[number];
type DailyMissionEntry = NonNullable<NonNullable<Awaited<ReturnType<typeof getPlayerGamificationOverview>>>["dailyMission"]>;

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

/* ────────────────────── UI Components ────────────────────── */

function BackgroundDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-indigo-700/6 blur-[160px]" />
      <div className="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-700/6 blur-[140px]" />
      <div className="absolute bottom-0 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-purple-700/4 blur-[160px]" />
    </div>
  );
}

function TabSectionShell({ icon, title, subtitle, children, badge }: { icon: string; title: string; subtitle?: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-700/60 bg-[#0b0f1e] p-8 shadow-2xl h-full flex flex-col">
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-start justify-between shrink-0 mb-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl shadow border border-slate-600">{icon}</span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
              {subtitle && <p className="text-sm font-medium text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {badge}
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          {children}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: string | number; icon: string; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 px-4 py-3.5 transition-all duration-300 hover:border-slate-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40">
      <div className={`absolute inset-0 opacity-[0.08] bg-gradient-to-br ${gradient} transition-opacity duration-300 group-hover:opacity-[0.18]`} />
      <div className="relative flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="text-lg font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

const premiumStatus = true;

/* ────────────────────── Main Page ────────────────────── */

export default async function AccountPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(locale);
  const token = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const session = token ? await getPlayerSession(token) : null;

  if (!session) {
    redirect("/login?from=/account");
  }

  const favoritesPromise = listFavoriteGames(session.user.id, 12);
  const historyPromise = listRecentlyPlayed(session.user.id, 12);
  const profilePromise = getPlayerProfile(session.user.id);
  const categoriesPromise = listCategories();
  const gamificationPromise = getPlayerGamificationOverview(session.user.id);
  const tasteProfilePromise = getPlayerTasteProfile(session.user.id);
  const achievementsPromise = listAchievementDefinitions();
  
  let totpDevice = { isEnabled: false };
  try {
    totpDevice = await prisma.totpDevice.findUnique({
      where: { userId: session.user.id },
      select: { isEnabled: true },
    }) ?? { isEnabled: false };
  } catch {
    // TOTP table might not exist or other DB error
  }

  const [favorites, history, profile, categories, gamification, tasteProfile, achievementDefinitions] = await Promise.all([
    favoritesPromise,
    historyPromise,
    profilePromise,
    categoriesPromise,
    gamificationPromise,
    tasteProfilePromise,
    achievementsPromise,
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
    ? Math.min(100, Math.round((gamification.dailyMission.progressCount / Math.max(gamification.dailyMission.targetCount, 1)) * 100))
    : 0;

  const unlockedAchievementKeys = new Set(gamification?.unlockedAchievementKeys ?? []);
  const achievementItems = gamification
    ? [...achievementDefinitions]
        .sort((left, right) => {
          const l = ACHIEVEMENT_SHOWCASE_ORDER.get(left.key) ?? 999;
          const r = ACHIEVEMENT_SHOWCASE_ORDER.get(right.key) ?? 999;
          return l - r || left.createdAt.localeCompare(right.createdAt);
        })
        .map((def) => {
          const p = getAchievementProgress(def, gamification.achievementSnapshot);
          return { ...def, unlocked: unlockedAchievementKeys.has(def.key), currentValue: p.currentValue, targetValue: p.targetValue, progressPercent: p.progressPercent };
        })
    : [];

  async function logout() {
    "use server";
    const cs = await cookies();
    const t = cs.get(PLAYER_SESSION_COOKIE)?.value;
    if (t) {
      const { deletePlayerSession } = await import("@/lib/user-auth");
      await deletePlayerSession(t);
    }
    cs.set(PLAYER_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    redirect("/");
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="relative min-h-full">
        <BackgroundDecorations />
        
        <div className="relative mx-auto max-w-7xl px-4 py-8 lg:px-8 animate-fade-in">
          <AccountHeader 
            profile={profile}
            playerInitials={playerInitials}
            memberSince={memberSince}
            tr={tr}
            dict={dict}
            logoutAction={logout}
            categories={categories}
          />

          {/* Email Verification Banner */}
          {!session.user.emailVerified && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-200">Verifique seu email</p>
                  <p className="text-xs text-amber-300/70">Confirme seu endereço de email para ativar todas as funcionalidades.</p>
                </div>
              </div>
              <form action="/api/auth/user/resend-verification" method="POST">
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
                >
                  Reenviar email
                </button>
              </form>
            </div>
          )}

          {/* Stats */}
          <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label={tr(dict, "player.level")} value={gamification?.level ?? 1} icon="⚡" gradient="from-amber-400 to-orange-500" />
            <StatCard label={tr(dict, "player.xp")} value={gamification?.xp.toLocaleString(locale) ?? "0"} icon="✨" gradient="from-cyan-400 to-blue-500" />
            <StatCard label={tr(dict, "player.streak")} value={`${gamification?.currentStreak ?? 0}d`} icon="🔥" gradient="from-orange-400 to-red-500" />
            <StatCard label={tr(dict, "player.favorites")} value={favorites.length} icon="❤️" gradient="from-pink-400 to-fuchsia-500" />
            <StatCard label={tr(dict, "player.played")} value={history.length} icon="🎮" gradient="from-emerald-400 to-teal-500" />
          </section>

          {/* Layout Grid */}
          <div className="animate-fade-in">
            <ProfileSidebarNav
              childrenMap={{
                feed: (
                  <ActivityFeed history={history} locale={locale} />
                ),
                wallet: (
                  <TabSectionShell icon="🪙" title={tr(dict, "player.wallet")} subtitle={tr(dict, "player.walletSubtitle")}>
                    <CoinsPanel />
                  </TabSectionShell>
                ),
                social: (
                  <TabSectionShell icon="👥" title={tr(dict, "player.social")} subtitle={tr(dict, "player.socialSubtitle")}>
                    <FriendsPanel />
                  </TabSectionShell>
                ),
                mission: (
                  <TabSectionShell icon="🎯" title={tr(dict, "player.journey")} subtitle={tr(dict, "player.journeySubtitle")}>
                    <div className="space-y-8">
                      <div className="rounded-2xl bg-slate-800 border border-slate-700/60 p-6 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-black text-white">{dailyMissionCard?.title}</h3>
                          <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-sm font-black text-emerald-400 border border-emerald-500/20">+{gamification?.dailyMission?.rewardXp} XP</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-700 mb-6">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 animate-progress-glow rounded-full" style={{ width: `${currentMissionProgressPercent}%` }} />
                        </div>
                        <Link href={dailyMissionCard?.href ?? "#"} className="inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] uppercase">{tr(dict, "player.startMission")}</Link>
                      </div>

                      {achievementItems.length > 0 && (
                        <div>
                          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                             <span className="text-xl">🏆</span> {tr(dict, "player.yourAchievements")}
                          </h3>
                          <AchievementCollection 
                            items={achievementItems} 
                            locale={locale} 
                            lockedLabel={tr(dict, "player.locked")} 
                            unlockedLabel={tr(dict, "player.unlocked")} 
                            layout="grid" 
                          />
                        </div>
                      )}
                    </div>
                  </TabSectionShell>
                ),
                library: (
                  <TabSectionShell icon="📚" title={tr(dict, "player.library")} subtitle={tr(dict, "player.librarySubtitle")}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {favorites.map(f => (
                        <Link
                          key={f.id}
                          href={`/games/${f.game.slug}`}
                          className="group flex flex-col aspect-[1.618] overflow-hidden rounded-2xl border border-white/5 bg-slate-900 transition-all hover:border-white/20"
                        >
                          <div className="relative flex-1 overflow-hidden">
                            <Image
                              src={f.game.thumbnail}
                              alt={f.game.title}
                              fill
                              unoptimized
                              className="object-fill transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </div>
                          <div className="px-3 py-1.5 flex-none bg-black/40">
                            <span className="text-[11px] font-black text-white line-clamp-1">{f.game.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </TabSectionShell>
                ),
                security: (
                  <TabSectionShell icon="🔒" title="Segurança" subtitle="Gerencie a segurança da sua conta">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-200">Verificação de email</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          session.user.emailVerified
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {session.user.emailVerified ? "Verificado" : "Não verificado"}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                        <TotpSetupFlow enabled={totpDevice?.isEnabled ?? false} />
                      </div>
                    </div>
                  </TabSectionShell>
                ),
              }}
            />
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800/40">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
