"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type GameEntry = { id: string; slug: string; title: string; thumbnail: string };
type RatedEntry = GameEntry & { rating: number };
type RecentEntry = GameEntry & { lastPlayedAt: string };

type Lists = {
  favorites: GameEntry[];
  recents: RecentEntry[];
  rated: RatedEntry[];
};

type Tab = "favorites" | "recents" | "rated";

const STAR = "★";

export function FavoritesHeart() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("favorites");
  const [lists, setLists] = useState<Lists | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/user/heart-lists");
      if (!res.ok) return;
      setLists(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open && !lists) void fetchLists();
  }, [open, lists, fetchLists]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentList: GameEntry[] =
    tab === "favorites"
      ? (lists?.favorites ?? [])
      : tab === "recents"
      ? (lists?.recents ?? [])
      : (lists?.rated ?? []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 text-slate-300 transition-colors hover:border-pink-500/60 hover:text-pink-400"
        aria-label="Favoritos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-[200] w-80 rounded-2xl border border-slate-700/80 bg-slate-950/98 shadow-2xl backdrop-blur-md">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {(["favorites", "recents", "rated"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t ? "border-b-2 border-pink-400 text-pink-300" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "favorites" ? "❤️ Favoritos" : t === "recents" ? "🕹️ Recentes" : "⭐ Curtidos"}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {!lists ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 animate-pulse" />
                    <div className="h-3 flex-1 rounded bg-slate-800 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : currentList.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                {tab === "favorites" ? "Nenhum favorito ainda." : tab === "recents" ? "Nenhum jogo recente." : "Nenhum jogo avaliado."}
              </div>
            ) : (
              currentList.map((g) => (
                <Link
                  key={g.id}
                  href={`/games/${g.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800/60 transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    <Image src={g.thumbnail} alt={g.title} fill unoptimized className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-200">{g.title}</p>
                    {"rating" in g && (
                      <p className="text-[10px] text-amber-400">{STAR.repeat((g as RatedEntry).rating)}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 px-4 py-2">
            <Link href="/account" onClick={() => setOpen(false)} className="block text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
              Ver no perfil
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
