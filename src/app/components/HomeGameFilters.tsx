"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslate } from "./LocaleContext";

type CatalogGame = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  category: string;
  views: number;
  featured: boolean;
};

type PaginationMeta = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function HomeGameFilters({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const t = useTranslate();
  const [category, setCategory] = useState(initialCategory ?? "");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"popular" | "newest">("popular");
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchGames = useCallback(
    async (p: { category: string; query: string; sort: string; page: number }) => {
      setLoading(true);
      const sp = new URLSearchParams();
      if (p.category) sp.set("category", p.category);
      if (p.query) sp.set("q", p.query);
      sp.set("sort", p.sort);
      sp.set("page", String(p.page));
      sp.set("pageSize", "24");
      try {
        const res = await fetch(`/api/public/games?${sp}`);
        const data = await res.json();
        setGames(data.items ?? []);
        setPagination(data.pagination ?? null);
      } catch {
        setGames([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* fetch on filter/sort/page change */
  useEffect(() => {
    fetchGames({ category, query, sort, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page]);

  /* debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchGames({ category, query, sort, page: 1 });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <section id="catalogo" className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
          {t("catalog.fullCatalog")}
        </h2>
        {pagination && pagination.totalItems > 0 && (
          <span className="text-[10px] text-slate-500 ml-1">
            ({pagination.totalItems} {t("catalog.games", { count: pagination.totalItems })})
          </span>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalog.searchPlaceholder")}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 pl-8 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            🔍
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setSort("popular");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              sort === "popular"
                ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200"
            }`}
          >
            🔥 {t("catalog.sortPopular")}
          </button>
          <button
            onClick={() => {
              setSort("newest");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              sort === "newest"
                ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200"
            }`}
          >
            ✨ {t("catalog.sortNewest")}
          </button>
        </div>
      </div>

      {/* Active filter indicator */}
      {category && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] text-slate-400">{t("catalog.filteringBy")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 px-3 py-1 text-[11px] font-semibold text-cyan-300">
            {category}
            <button
              onClick={() => { setCategory(""); setPage(1); }}
              className="ml-0.5 rounded-full hover:bg-cyan-400/20 p-0.5 transition-colors text-cyan-400"
              aria-label={t("catalog.clearFilter")}
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* Game grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-800/60 bg-slate-900/50 animate-pulse"
            >
              <div className="aspect-[16/10] bg-slate-800/50" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 w-3/4 bg-slate-800/50 rounded" />
                <div className="h-2 w-1/2 bg-slate-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-8 text-center">
          <p className="text-sm text-slate-400">{t("catalog.noGamesFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger-children">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group block overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-800/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 animate-fade-in-up"
            >
              <div className="game-card-play relative aspect-[16/10] overflow-hidden bg-slate-950">
                <Image
                  src={game.thumbnail}
                  alt={game.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 group-hover:from-black/60" />
                {game.featured && (
                  <span className="absolute left-2 top-2 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg shadow-amber-400/20">
                    ★
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="truncate text-[13px] font-semibold text-slate-100 transition-colors group-hover:text-cyan-200">
                  {game.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                  {game.category && (
                    <span className="transition-colors group-hover:text-slate-400">
                      {game.category}
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR").format(game.views)} {t("catalog.views")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-40 hover:border-slate-600 transition-colors"
          >
            ← {t("common.previous")}
          </button>
          <span className="text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-40 hover:border-slate-600 transition-colors"
          >
            {t("common.next")} →
          </button>
        </div>
      )}
    </section>
  );
}
