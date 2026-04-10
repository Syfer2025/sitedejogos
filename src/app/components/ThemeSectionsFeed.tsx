"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { CatalogGameCard } from "@/app/components/CatalogGameCard";
import {
  CatalogCategoryIcon,
  getCatalogCategoryPresentation,
} from "@/lib/catalog-category-presentation";
import { slugify } from "@/lib/game-schema";

type ThemeGame = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  category: string;
  views: number;
  featured: boolean;
};

type ThemeSection = {
  category: string;
  totalGames: number;
  games: ThemeGame[];
};

type ThemeSectionsFeedProps = {
  initialSections: ThemeSection[];
  initialHasMore: boolean;
  initialNextOffset: number | null;
  sort: "popular" | "newest";
};

type ThemeSectionsApiPayload = {
  items: ThemeSection[];
  hasMore: boolean;
  nextOffset: number | null;
};

const BATCH_SIZE = 3;
const GAMES_PER_CATEGORY = 14;

export function ThemeSectionsFeed({
  initialSections,
  initialHasMore,
  initialNextOffset,
  sort,
}: ThemeSectionsFeedProps) {
  const [sections, setSections] = useState(initialSections);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    setSections(initialSections);
    setHasMore(initialHasMore);
    setNextOffset(initialNextOffset);
    setLoadingMore(false);
    setLoadError(null);
    loadingRef.current = false;
  }, [initialSections, initialHasMore, initialNextOffset, sort]);

  const loadMoreSections = useCallback(async () => {
    if (loadingRef.current || !hasMore || nextOffset === null) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoadingMore(true);
      setLoadError(null);

      const searchParams = new URLSearchParams({
        offset: String(nextOffset),
        limit: String(BATCH_SIZE),
        gamesPerCategory: String(GAMES_PER_CATEGORY),
        sort,
      });

      const response = await fetch(`/api/public/games/themes?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar mais temas do catálogo.");
      }

      const payload = (await response.json()) as ThemeSectionsApiPayload;

      setSections((current) => [...current, ...payload.items]);
      setHasMore(payload.hasMore);
      setNextOffset(payload.nextOffset);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Falha ao carregar mais temas do catálogo.",
      );
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, nextOffset, sort]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) {
      return;
    }

    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreSections();
        }
      },
      {
        rootMargin: "500px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMoreSections]);

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const presentation = getCatalogCategoryPresentation(section.category);

        return (
          <section
            key={section.category}
            className={`overflow-hidden rounded-[30px] border p-5 md:p-6 ${presentation.sectionClassName}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${presentation.iconShellClassName}`}
                >
                  <CatalogCategoryIcon category={section.category} className="h-6 w-6" />
                </span>
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.18em] ${presentation.mutedTextClassName}`}>
                    tema em rotação
                  </p>
                  <h2 className={`mt-1 text-2xl font-semibold tracking-tight ${presentation.titleClassName}`}>
                    {section.category}
                  </h2>
                  <p className={`mt-2 max-w-2xl text-sm ${presentation.mutedTextClassName}`}>
                    {presentation.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-slate-200/90">
                  {section.totalGames} jogos publicados
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-slate-200/90">
                  {section.games.length} visíveis nesta faixa
                </span>
                <Link
                  href={`/category/${slugify(section.category)}`}
                  className={`rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] transition-colors ${presentation.linkClassName}`}
                >
                  abrir categoria
                </Link>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className={`text-xs ${presentation.mutedTextClassName}`}>
                Role na horizontal para ver mais variedade deste tema.
              </p>
            </div>

            <div className="mt-6 -mx-5 overflow-x-auto px-5 pb-2 md:-mx-6 md:px-6">
              <div className="flex min-w-max gap-4 snap-x snap-mandatory">
                {section.games.map((game) => (
                  <div key={game.id} className="w-[210px] shrink-0 snap-start sm:w-[226px] lg:w-[240px]">
                    <CatalogGameCard game={game} showCategoryBadge={false} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {loadError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      ) : null}

      {hasMore ? (
        <div className="space-y-4">
          <div ref={sentinelRef} className="h-1 w-full" />

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-5 text-center">
            {loadingMore ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">Carregando mais temas...</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col aspect-[1.618] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 animate-pulse"
                    >
                      <div className="flex-1 bg-slate-800/70" />
                      <div className="p-2 flex-none space-y-1.5">
                        <div className="h-2 rounded bg-slate-800/70" />
                        <div className="h-2 w-2/3 rounded bg-slate-800/50" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void loadMoreSections()}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Carregar mais temas
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/60 px-5 py-4 text-center text-sm text-slate-400">
          Todos os temas priorizados do catálogo foram carregados.
        </div>
      )}
    </div>
  );
}