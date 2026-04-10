"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";

import {
  getCatalogCategoryPresentation,
} from "@/lib/catalog-category-presentation";
import { getCategoryEmoji } from "@/lib/catalog-category-emoji";

import { TrackedLink } from "./TrackedLink";
import { CatalogGameCard } from "./CatalogGameCard";
import { useTranslate } from "./LocaleContext";

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

type HomeThemeCatalogProps = {
  initialSections: ThemeSection[];
  initialHasMore: boolean;
  initialNextOffset: number | null;
  initialCategory?: string;
  initialQuery?: string;
  isAuthenticated?: boolean;
};

type ThemeSectionsApiPayload = {
  items: ThemeSection[];
  hasMore: boolean;
  nextOffset: number | null;
};

type PublicGamesApiPayload = {
  items: ThemeGame[];
  pagination?: {
    totalItems: number;
    currentPage: number;
    hasNextPage: boolean;
  };
};

type CatalogFilterDetail = {
  category: string;
};

const CATALOG_FILTER_EVENT = "catalog:filter";
const THEME_BATCH_SIZE = 3;
const GAMES_PER_THEME = 14;
const FOCUSED_THEME_PAGE_SIZE = 24;

export function dispatchCatalogFilter(category: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<CatalogFilterDetail>(CATALOG_FILTER_EVENT, {
      detail: { category },
    }),
  );

  const catalogElement = document.getElementById("catalogo");

  if (catalogElement) {
    catalogElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function formatViews(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

// Local card bridge
function ThemeGameCard({ game }: { game: ThemeGame }) {
  return (
    <CatalogGameCard game={game as any} />
  );
}

export function HomeThemeCatalog({
  initialSections,
  initialHasMore,
  initialNextOffset,
  initialCategory = "",
  initialQuery = "",
  isAuthenticated = false,
}: HomeThemeCatalogProps) {
  const t = useTranslate();
  const [sections, setSections] = useState(initialSections);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [focusedGames, setFocusedGames] = useState<ThemeGame[]>([]);
  const [focusedTotal, setFocusedTotal] = useState<number | null>(null);
  const [focusedPage, setFocusedPage] = useState(1);
  const [focusedHasMore, setFocusedHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFocused, setLoadingFocused] = useState(false);
  const [loadingMoreFocused, setLoadingMoreFocused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const focusedLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const focusedSentinelRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSections(initialSections);
    setHasMore(initialHasMore);
    setNextOffset(initialNextOffset);
  }, [initialSections, initialHasMore, initialNextOffset]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handleCatalogFilter(event: Event) {
      const detail = (event as CustomEvent<CatalogFilterDetail>).detail;
      setActiveQuery("");
      setActiveCategory(detail.category);

      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    window.addEventListener(CATALOG_FILTER_EVENT, handleCatalogFilter);

    return () => {
      window.removeEventListener(CATALOG_FILTER_EVENT, handleCatalogFilter);
    };
  }, []);

  const loadMoreThemes = useCallback(async () => {
    if (loadingRef.current || !hasMore || nextOffset === null || activeCategory || activeQuery) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoadingMore(true);
      setLoadError(null);

      const searchParams = new URLSearchParams({
        offset: String(nextOffset),
        limit: String(THEME_BATCH_SIZE),
        gamesPerCategory: String(GAMES_PER_THEME),
        sort: "popular",
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
  }, [activeCategory, activeQuery, hasMore, nextOffset]);

  useEffect(() => {
    if (activeCategory || activeQuery || !hasMore || !sentinelRef.current) {
      return;
    }

    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreThemes();
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
  }, [activeCategory, activeQuery, hasMore, loadMoreThemes]);

  useEffect(() => {
    if (!activeCategory && !activeQuery) {
      focusedLoadingRef.current = false;
      setFocusedGames([]);
      setFocusedTotal(null);
      setFocusedPage(1);
      setFocusedHasMore(false);
      setLoadingFocused(false);
      setLoadingMoreFocused(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    focusedLoadingRef.current = false;
    setLoadingMoreFocused(false);

    async function loadFocusedCategory() {
      try {
        setLoadingFocused(true);
        setLoadError(null);

        const searchParams = new URLSearchParams({
          sort: "popular",
          page: "1",
          pageSize: String(FOCUSED_THEME_PAGE_SIZE),
        });

        if (activeCategory) {
          searchParams.set("category", activeCategory);
        }

        if (activeQuery) {
          searchParams.set("q", activeQuery);
        }

        const response = await fetch(`/api/public/games?${searchParams.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            activeQuery
              ? "Falha ao carregar os resultados da busca."
              : "Falha ao carregar o tema selecionado.",
          );
        }

        const payload = (await response.json()) as PublicGamesApiPayload;

        if (cancelled) {
          return;
        }

        setFocusedGames(payload.items ?? []);
        setFocusedTotal(payload.pagination?.totalItems ?? payload.items?.length ?? 0);
        setFocusedPage(payload.pagination?.currentPage ?? 1);
        setFocusedHasMore(payload.pagination?.hasNextPage ?? false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFocusedGames([]);
        setFocusedTotal(null);
        setFocusedPage(1);
        setFocusedHasMore(false);
        setLoadError(
          error instanceof Error
            ? error.message
            : activeQuery
            ? "Falha ao carregar os resultados da busca."
            : "Falha ao carregar o tema selecionado.",
        );
      } finally {
        if (!cancelled) {
          setLoadingFocused(false);
        }
      }
    }

    void loadFocusedCategory();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeQuery]);

  const loadMoreFocusedGames = useCallback(async () => {
    if (focusedLoadingRef.current || !focusedHasMore || (!activeCategory && !activeQuery)) {
      return;
    }

    try {
      focusedLoadingRef.current = true;
      setLoadingMoreFocused(true);
      setLoadError(null);

      const searchParams = new URLSearchParams({
        sort: "popular",
        page: String(focusedPage + 1),
        pageSize: String(FOCUSED_THEME_PAGE_SIZE),
      });

      if (activeCategory) {
        searchParams.set("category", activeCategory);
      }

      if (activeQuery) {
        searchParams.set("q", activeQuery);
      }

      const response = await fetch(`/api/public/games?${searchParams.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          activeQuery
            ? "Falha ao carregar mais resultados da busca."
            : "Falha ao carregar mais jogos deste tema.",
        );
      }

      const payload = (await response.json()) as PublicGamesApiPayload;

      setFocusedGames((current) => [...current, ...(payload.items ?? [])]);
      setFocusedTotal(payload.pagination?.totalItems ?? focusedTotal ?? 0);
      setFocusedPage(payload.pagination?.currentPage ?? focusedPage + 1);
      setFocusedHasMore(payload.pagination?.hasNextPage ?? false);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : activeQuery
          ? "Falha ao carregar mais resultados da busca."
          : "Falha ao carregar mais jogos deste tema.",
      );
    } finally {
      focusedLoadingRef.current = false;
      setLoadingMoreFocused(false);
    }
  }, [activeCategory, activeQuery, focusedHasMore, focusedPage, focusedTotal]);

  useEffect(() => {
    if ((!activeCategory && !activeQuery) || !focusedHasMore || !focusedSentinelRef.current) {
      return;
    }

    const sentinel = focusedSentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreFocusedGames();
        }
      },
      {
        rootMargin: "600px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [activeCategory, activeQuery, focusedHasMore, loadMoreFocusedGames]);

  const renderThemeSection = useCallback(
    (
      section: ThemeSection,
      options: {
        focused?: boolean;
      } = {},
    ) => {
      const presentation = getCatalogCategoryPresentation(section.category);
      const isFocused = options.focused ?? false;

      return (
        <section
          key={`${section.category}-${isFocused ? "focused" : "feed"}`}
          className="mb-3 animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              {section.category}
            </h3>
            {isFocused ? (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("");
                  setActiveQuery("");
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {t("common.back")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveCategory(section.category)}
                className="text-[11px] text-slate-500 hover:text-cyan-300 transition-colors"
              >
                {t("common.viewMore")} →
              </button>
            )}
          </div>

          <div className="mt-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div
              className="grid gap-2"
              style={{
                gridTemplateRows: section.games.length > 5 ? 'repeat(2, 1fr)' : '1fr',
                gridAutoFlow: 'column',
                gridAutoColumns: 'clamp(160px, calc((100vw - 200px) / 5), 220px)',
              }}
            >
              {section.games.map((game) => (
                <ThemeGameCard
                  key={game.id}
                  game={game}
                />
              ))}
            </div>
          </div>
        </section>
      );
    },
    [],
  );

  const focusedPresentation = getCatalogCategoryPresentation(activeCategory || "Arcade");
  const focusedTitle = activeCategory ? activeCategory : `Busca: ${activeQuery}`;
  const focusedDescription = activeQuery
    ? `Resultados filtrados por "${activeQuery}" dentro do catálogo one-page.`
    : focusedPresentation.description;

  return (
    <section ref={sectionRef} id="catalogo" className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              {t("catalog.title")}
            </h2>
            {activeQuery ? (
               <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[9px] font-medium text-slate-400">{t("catalog.searchMode")}</span>
            ) : null}
          </div>
        </div>

        {activeQuery || activeCategory ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {activeQuery ? (
              <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-slate-300">
                {t("catalog.searchPrefix")}: {activeQuery}
              </span>
            ) : null}
            {activeCategory ? (
              <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-slate-300">
                {t("catalog.themePrefix")}: {activeCategory}
              </span>
            ) : null}
            <button
               type="button"
               onClick={() => {
                 setActiveCategory("");
                 setActiveQuery("");
               }}
               className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
            >
               {t("catalog.clearFilter")} ×
            </button>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      ) : null}

      {loadingFocused && (activeCategory || activeQuery) ? (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col aspect-[2/1] overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 animate-pulse"
              >
                <div className="flex-1 bg-slate-800/60" />
                <div className="p-2 flex-none space-y-1.5">
                  <div className="h-2 rounded bg-slate-800/70" />
                  <div className="h-2 w-2/3 rounded bg-slate-800/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeCategory || activeQuery ? (
        <section className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 p-3 sm:p-4 animate-fade-in-up">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${focusedPresentation.iconShellClassName}`}
              >
                {activeQuery ? "🔎" : getCategoryEmoji(activeCategory)}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {activeQuery ? t("catalog.activeSearchLabel") : t("catalog.activeThemeLabel")}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                  {focusedTitle}
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                  {focusedDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300">
                {focusedTotal ?? focusedGames.length} {t("catalog.games")}
              </span>
            </div>
          </div>

          {focusedGames.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
              {t("catalog.noGamesFound")}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3">
              {focusedGames.map((game) => (
                <ThemeGameCard
                  key={game.id}
                  game={game}
                />
              ))}
            </div>
          )}

          {focusedHasMore ? (
            <div className="mt-5 space-y-3">
              <div ref={focusedSentinelRef} className="h-1 w-full" />
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-center">
                {loadingMoreFocused ? (
                  <p className="text-sm text-slate-300">{t("catalog.loadingMoreThemes")}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMoreFocusedGames()}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    {t("catalog.loadMoreGames")}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="space-y-4">
            {(() => {
              const largeSections = sections.filter(s => s.games.length >= 6);
              const smallSections = sections.filter(s => s.games.length < 6);
              const mergedGames = smallSections.flatMap(s => s.games);
              
              const allRenderedSections = [...largeSections];
              if (mergedGames.length > 0) {
                 allRenderedSections.push({
                    category: "Diversos",
                    totalGames: mergedGames.length,
                    games: mergedGames
                 });
              }

              return allRenderedSections.map((section) => renderThemeSection(section));
            })()}
          </div>

          {hasMore ? (
            <div className="space-y-3">
              <div ref={sentinelRef} className="h-1 w-full" />
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 text-center">
                {loadingMore ? (
                  <p className="text-sm text-slate-300">{t("catalog.loadingMoreThemes")}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMoreThemes()}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    {t("catalog.loadMoreThemes")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 px-4 py-3 text-center text-sm text-slate-400">
              {t("catalog.allThemesLoaded")}
            </div>
          )}
        </>
      )}
    </section>
  );
}
