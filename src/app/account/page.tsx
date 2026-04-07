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
import { ProfileSidebarNav, type ProfileTabKey } from "../components/ProfileSidebarNav";
import { ActivityFeed } from "../components/ActivityFeed";

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
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[100px]" />
      <div className="absolute bottom-0 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/5 blur-[120px]" />
    </div>
  );
}

function TabSectionShell({ icon, title, subtitle, children, badge }: { icon: string; title: string; subtitle?: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-8 shadow-2xl h-full flex flex-col">
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-start justify-between shrink-0 mb-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl shadow-inner border border-white/5">{icon}</span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
              {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
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
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.03] bg-white/[0.04] backdrop-blur-2xl px-4 py-3.5 transition-all duration-300 hover:border-white/10 hover:-translate-y-1 hover:shadow-xl">
      <div className={`absolute inset-0 opacity-[0.05] bg-gradient-to-br ${gradient} transition-opacity duration-300 group-hover:opacity-[0.1]`} />
      <div className="relative flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
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
    <div className="relative min-h-screen">
      <BackgroundDecorations />
      
      <div className="relative mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-2xl shadow-2xl">
          <div className="h-48 md:h-64 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#050816] via-slate-900 to-indigo-950" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.2),transparent_70%)]" />
            {/* Fade-out mask for the banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent opacity-90" />
          </div>
          
          <div className="px-6 pb-8 md:px-10">
            <div className="relative -mt-20 flex flex-col items-center gap-6 md:-mt-24 md:flex-row md:items-end">
              <div className="h-40 w-40 flex items-center justify-center rounded-full border-4 border-slate-950/80 bg-gradient-to-br from-cyan-400 to-purple-600 shadow-2xl text-4xl font-black text-white shrink-0 ring-4 ring-white/10" 
                   style={profile.avatarUrl ? { backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!profile.avatarUrl && playerInitials}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <h1 className="text-3xl font-black text-white md:text-4xl tracking-tight">{profile.displayName}</h1>
                  {premiumStatus && <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-black italic text-slate-950 shadow-lg shadow-amber-500/20">NITRO</span>}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">
                  {profile.email} • Membro desde {memberSince}
                </p>
              </div>

              <form action={logout} className="shrink-0 mb-2">
                 <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">Sair</button>
              </form>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 animate-fade-in-up">
          <StatCard label="Nível" value={gamification?.level ?? 1} icon="⚡" gradient="from-amber-400 to-orange-500" />
          <StatCard label="XP total" value={gamification?.xp.toLocaleString(locale) ?? "0"} icon="✨" gradient="from-cyan-400 to-blue-500" />
          <StatCard label="Streak" value={`${gamification?.currentStreak ?? 0}d`} icon="🔥" gradient="from-orange-400 to-red-500" />
          <StatCard label="Favoritos" value={favorites.length} icon="❤️" gradient="from-pink-400 to-fuchsia-500" />
          <StatCard label="Recentes" value={history.length} icon="🎮" gradient="from-emerald-400 to-teal-500" />
        </section>

        {/* Layout Grid */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <ProfileSidebarNav 
            notificationCount={gamification?.unreadNotifications ?? 0}
            childrenMap={{
              feed: (
                <ActivityFeed history={history} locale={locale} />
              ),
              wallet: (
                <TabSectionShell icon="🪙" title="Sua Carteira" subtitle="Gerencie seus créditos e temas.">
                  <CoinsPanel />
                </TabSectionShell>
              ),
              social: (
                <TabSectionShell icon="👥" title="Rede Social" subtitle="Seus amigos e rivais.">
                  <FriendsPanel />
                </TabSectionShell>
              ),
              mission: (
                <TabSectionShell icon="🎯" title="Minha Jornada" subtitle="Missões e conquistas diárias.">
                  <div className="space-y-8">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-white">{dailyMissionCard?.title}</h3>
                        <span className="text-emerald-400 font-bold">+{gamification?.dailyMission?.rewardXp} XP</span>
                      </div>
                      <div className="h-4 rounded-full bg-slate-900/50 overflow-hidden border border-white/5 mb-6">
                        <div className="h-full bg-emerald-500 transition-all duration-700 animate-progress-glow" style={{ width: `${currentMissionProgressPercent}%` }} />
                      </div>
                      <Link href={dailyMissionCard?.href ?? "#"} className="inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]">COMEÇAR MISSÃO</Link>
                    </div>

                    {achievementItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                           <span className="text-xl">🏆</span> Suas Conquistas
                        </h3>
                        <AchievementCollection 
                          items={achievementItems} 
                          locale={locale} 
                          lockedLabel={homeTexts.achievementsLockedLabel ?? "Bloqueado"} 
                          unlockedLabel={homeTexts.achievementsUnlockedLabel ?? "Conquistada"} 
                          layout="grid" 
                        />
                      </div>
                    )}
                  </div>
                </TabSectionShell>
              ),
              library: (
                <TabSectionShell icon="📚" title="Minha Biblioteca" subtitle="Seus favoritos e recomendados.">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {favorites.map(f => (
                      <Link key={f.id} href={`/games/${f.game.slug}`} className="group relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-slate-900 transition-all hover:border-white/20">
                        <Image src={f.game.thumbnail} alt={f.game.title} fill className="object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex items-end">
                          <span className="text-xs font-black text-white">{f.game.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabSectionShell>
              ),
              profile: (
                <TabSectionShell icon="✏️" title="Editar Perfil" subtitle="Customize sua identidade visual.">
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
                </TabSectionShell>
              ),
              notifications: (
                <TabSectionShell icon="🔔" title="Notificações" subtitle="Avisos do portal.">
                  <div className="space-y-4">
                    {gamification?.notifications.map(n => (
                      <div key={n.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all hover:border-white/10 group cursor-default">
                        <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </TabSectionShell>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
