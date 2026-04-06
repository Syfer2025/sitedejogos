"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";

import {
  getCatalogCategoryPresentation,
} from "@/lib/catalog-category-presentation";
import { getCategoryEmoji } from "@/lib/catalog-category-emoji";

import { TrackedLink } from "./TrackedLink";

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

function HomeThemeGameCard({
  game,
  trackingPath,
  variant = "default",
}: {
  game: ThemeGame;
  trackingPath: string;
  variant?: "default" | "compact";
}) {
  const isCompact = variant === "compact";

  return (
    <TrackedLink
      href={`/games/${game.slug}`}
      trackingPath={trackingPath}
      className={`group block overflow-hidden border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-800/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 ${isCompact ? "rounded-lg" : "rounded-xl"}`}
    >
      <div className="game-card-play relative aspect-[16/10] overflow-hidden bg-slate-950">
        <Image
          src={game.thumbnail}
          alt={game.title}
          fill
          sizes={isCompact ? "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1536px) 18vw, 14vw" : "220px"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 group-hover:from-black/60" />
        {game.featured ? (
          <span className="absolute left-2 top-2 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg shadow-amber-400/20">
            ★
          </span>
        ) : null}
        <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          👁 {formatViews(game.views)}
        </span>
      </div>
      <div className={isCompact ? "p-2" : "p-2.5"}>
        <h3 className={`truncate font-semibold text-slate-100 transition-colors group-hover:text-cyan-200 ${isCompact ? "text-[12px]" : "text-[13px]"}`}>
          {game.title}
        </h3>
        <div className={`mt-1 flex items-center gap-2 text-slate-500 ${isCompact ? "text-[9px]" : "text-[10px]"}`}>
          <span className="truncate">{game.category}</span>
          <span>•</span>
          <span>{formatViews(game.views)} views</span>
        </div>
      </div>
    </TrackedLink>
  );
}

export function HomeThemeCatalog({
  initialSections,
  initialHasMore,
  initialNextOffset,
  initialCategory = "",
  initialQuery = "",
}: HomeThemeCatalogProps) {
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
          className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 animate-fade-in-up"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${presentation.iconShellClassName}`}
              >
                {getCategoryEmoji(section.category)}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isFocused ? "tema fixado" : "tema em destaque"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                  {section.category}
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                  {presentation.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300">
                {section.totalGames} jogos no tema
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300">
                {section.games.length} cartas visiveis agora
              </span>
              {isFocused ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("");
                    setActiveQuery("");
                  }}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  voltar ao feed completo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveCategory(section.category)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-medium transition-colors ${presentation.chipClassName}`}
                >
                  ver so este tema
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Role na horizontal para explorar mais jogos deste tema sem alongar demais a home.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex min-w-max gap-3 snap-x snap-mandatory">
              {section.games.map((game) => (
                <div key={game.id} className="w-[208px] shrink-0 snap-start sm:w-[220px] lg:w-[230px]">
                  <HomeThemeGameCard
                    game={game}
                    trackingPath={`/home/catalog/${section.category.toLowerCase()}/${game.slug}`}
                  />
                </div>
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
              Catalogo completo
            </h2>
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[9px] font-medium text-slate-400">
              {activeQuery ? "modo busca" : activeCategory ? "modo focado" : "one-page feed"}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            A home agora percorre o catalogo inteiro em blocos por tema, com trilhas horizontais para mostrar mais variedade sem quebrar o ritmo da pagina.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">
            {activeCategory || activeQuery ? focusedGames.length : sections.reduce((total, section) => total + section.games.length, 0)} jogos visiveis agora
          </span>
          {activeQuery ? (
            <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-slate-300">
              busca ativa: {activeQuery}
            </span>
          ) : null}
          {activeCategory ? (
            <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-slate-300">
              tema ativo: {activeCategory}
            </span>
          ) : null}
        </div>
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
                className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 animate-pulse"
              >
                <div className="aspect-[16/10] bg-slate-800/60" />
                <div className="space-y-2 p-3">
                  <div className="h-3 rounded bg-slate-800/70" />
                  <div className="h-3 w-2/3 rounded bg-slate-800/50" />
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
                  {activeQuery ? "busca ativa" : "tema fixado"}
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
                {focusedTotal ?? focusedGames.length} jogos neste recorte
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300">
                {focusedGames.length} carregados agora
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("");
                  setActiveQuery("");
                }}
                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
              >
                voltar ao feed completo
              </button>
            </div>
          </div>

          {focusedGames.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
              Nenhum jogo encontrado para esse recorte.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {focusedGames.map((game) => (
                <HomeThemeGameCard
                  key={game.id}
                  game={game}
                  trackingPath={`/home/focused/${(activeCategory || activeQuery).toLowerCase()}/${game.slug}`}
                  variant="compact"
                />
              ))}
            </div>
          )}

          {focusedHasMore ? (
            <div className="mt-5 space-y-3">
              <div ref={focusedSentinelRef} className="h-1 w-full" />
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-center">
                {loadingMoreFocused ? (
                  <p className="text-sm text-slate-300">Carregando mais jogos deste recorte...</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMoreFocusedGames()}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    Carregar mais jogos
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="space-y-4">
            {sections.map((section) => renderThemeSection(section))}
          </div>

          {hasMore ? (
            <div className="space-y-3">
              <div ref={sentinelRef} className="h-1 w-full" />
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 text-center">
                {loadingMore ? (
                  <p className="text-sm text-slate-300">Carregando mais temas da home...</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMoreThemes()}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    Carregar mais temas
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 px-4 py-3 text-center text-sm text-slate-400">
              Todos os temas priorizados ja entraram no feed da home.
            </div>
          )}
        </>
      )}
    </section>
  );
}
