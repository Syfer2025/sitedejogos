"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslate } from "./LocaleContext";
import { TrackedLink } from "./TrackedLink";

type HeaderProps = {
  playerSession: any;
  t: any;
  logoutAction: () => Promise<void>;
  initialNotifications?: any[];
  favorites?: any[];
  recentGames?: any[];
  ratedGames?: any[];
};

export function Header({ 
  playerSession, 
  t, 
  logoutAction,
  initialNotifications = [],
  favorites = [],
  recentGames = [],
  ratedGames = []
}: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHeartOpen, setIsHeartOpen] = useState(false);
  const [heartTab, setHeartTab] = useState<"favorites" | "recent" | "rated">("favorites");
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (heartRef.current && !heartRef.current.contains(event.target as Node)) {
        setIsHeartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const premium = playerSession?.user?.isPremium;

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <nav className="relative flex h-full w-full items-center gap-4 px-4">
        <div className="flex shrink-0 items-center gap-4 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-white">Gasty Games</span>
              <span className="hidden text-[11px] text-slate-400 sm:block">{t.noInstalls}</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
            <Link href="/" className="rounded-md px-3 py-1.5 transition-all duration-150 hover:bg-slate-800/60 hover:text-white">{t.home}</Link>
            <Link href="/blog" className="rounded-md px-3 py-1.5 transition-all duration-150 hover:bg-slate-800/60 hover:text-white">{t.blog}</Link>
          </div>
        </div>

        {/* Search - Hidden on mobile, centered on desktop */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 xl:block">
          <form action="/#catalogo" className="pointer-events-auto relative w-full">
            <input
              name="q"
              type="text"
              placeholder={t.search}
              className="h-9 w-full rounded-full border border-slate-700/70 bg-slate-900/80 px-4 pr-16 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/60 focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
            />
            <button type="submit" className="absolute right-1 top-1 inline-flex h-7 items-center rounded-full bg-cyan-400/15 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-400/25">
              {t.search?.split(" ")[0]}
            </button>
          </form>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="shrink-0"><LanguageSwitcher /></div>
          
          {playerSession ? (
            <>
              {/* Heart Button (Recent, Favorites, Rated) */}
              <div className="relative" ref={heartRef}>
                <button 
                  onClick={() => setIsHeartOpen(!isHeartOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-pink-400 hover:border-pink-500/50 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="h-5 w-5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                
                {isHeartOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl">
                    <div className="flex p-1 gap-1 border-b border-slate-800 mb-1">
                      <button 
                        onClick={() => setHeartTab("favorites")}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${heartTab === "favorites" ? "bg-pink-500/20 text-pink-300" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        Favoritos
                      </button>
                      <button 
                        onClick={() => setHeartTab("recent")}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${heartTab === "recent" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        Recentes
                      </button>
                      <button 
                        onClick={() => setHeartTab("rated")}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${heartTab === "rated" ? "bg-amber-500/20 text-amber-300" : "text-slate-500 hover:bg-slate-800"}`}
                      >
                        Curtidos
                      </button>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto scrollbar-thin p-1">
                      {heartTab === "favorites" && (
                        favorites.length > 0 ? (
                          favorites.map((f: any) => (
                            <Link key={f.game.id} href={`/games/${f.game.slug}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                              <img src={f.game.thumbnail} className="h-10 w-10 rounded-lg object-cover border border-slate-800" />
                              <span className="text-xs font-medium text-slate-200 group-hover:text-pink-300 truncate">{f.game.title}</span>
                            </Link>
                          ))
                        ) : <p className="text-[10px] text-slate-500 text-center py-4">Nenhum favorito ainda.</p>
                      )}
                      {heartTab === "recent" && (
                        recentGames.length > 0 ? (
                          recentGames.map((g: any) => (
                            <Link key={g.game.id} href={`/games/${g.game.slug}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                              <img src={g.game.thumbnail} className="h-10 w-10 rounded-lg object-cover border border-slate-800" />
                              <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">{g.game.title}</span>
                            </Link>
                          ))
                        ) : <p className="text-[10px] text-slate-500 text-center py-4">Nenhum jogo recente.</p>
                      )}
                      {heartTab === "rated" && (
                        ratedGames.length > 0 ? (
                          ratedGames.map((r: any) => (
                            <Link key={r.game.id} href={`/games/${r.game.slug}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                              <img src={r.game.thumbnail} className="h-10 w-10 rounded-lg object-cover border border-slate-800" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 truncate">{r.game.title}</span>
                                <span className="text-[9px] text-amber-400">{"★".repeat(r.value)}</span>
                              </div>
                            </Link>
                          ))
                        ) : <p className="text-[10px] text-slate-500 text-center py-4">Nenhuma avaliação feita.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {initialNotifications.some((n: any) => !n.isRead) && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notificações</span>
                      <button className="text-[9px] text-cyan-400 hover:text-cyan-300">Marcar todas como lidas</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {initialNotifications.length > 0 ? (
                        initialNotifications.map((n: any) => (
                          <div key={n.id} className={`p-4 border-b border-slate-800/50 hover:bg-white/5 transition-all ${!n.isRead ? "bg-cyan-500/5" : ""}`}>
                            <p className="text-xs font-bold text-slate-100 mb-1">{n.title}</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-slate-600 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center py-8 opacity-20">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 mb-2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          </svg>
                          <p className="text-xs">Tudo limpo por aqui</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pic & Menu */}
              <div className="flex items-center gap-2">
                <Link href="/account" className="group flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 p-1 pr-3 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5">
                  <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-700 bg-slate-800 transition-all group-hover:border-cyan-400/50">
                    {playerSession.user.image || playerSession.user.avatarUrl ? (
                      <img 
                        src={playerSession.user.image || playerSession.user.avatarUrl} 
                        alt="Profile" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                        {playerSession.user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-100 truncate max-w-[80px]">
                      {playerSession.user.displayName}
                    </span>
                    {premium && <span className="text-[8px] font-bold uppercase tracking-tighter text-amber-400 -mt-1">Nitro ★</span>}
                  </div>
                </Link>
                
                <form action={logoutAction}>
                  <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex items-center rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-100 transition-all hover:border-cyan-400 hover:bg-cyan-500/15 hover:scale-105 active:scale-95">
              {t.login}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
