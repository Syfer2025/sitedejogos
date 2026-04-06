import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";

import { listCategories, listGamesPage } from "@/data/gamesStore";
import { slugify } from "@/lib/game-schema";
import { buildPageHref, getSingleQueryValue, resolvePagination } from "@/lib/pagination";

type GamesPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    page?: string | string[];
    q?: string | string[];
    sort?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Todos os jogos",
  description: "Catálogo completo de jogos HTML5 publicados no Arcade Nexus.",
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSingleQueryValue(resolvedSearchParams.q)?.trim() ?? "";
  const category = getSingleQueryValue(resolvedSearchParams.category)?.trim() ?? "";
  const sort = getSingleQueryValue(resolvedSearchParams.sort) === "popular" ? "popular" : "newest";
  const { page } = resolvePagination({
    page: resolvedSearchParams.page,
    defaultPageSize: 12,
  });

  const [catalog, categories] = await Promise.all([
    listGamesPage({
      category: category || undefined,
      publishedOnly: true,
      query: query || undefined,
      page,
      pageSize: 12,
      sortBy: query ? "popular" : sort,
    }),
    listCategories(),
  ]);

  const games = catalog.items;
  const pagination = catalog.pagination;
  const baseParams = {
    category: category || undefined,
    q: query || undefined,
    sort: sort === "popular" ? sort : undefined,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Browse Games
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          {category ? `Jogos da categoria ${category}` : "Todos os jogos"}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Explore o catálogo completo de jogos HTML5 do portal, com filtros por
          categoria e busca por título, tag ou gênero.
        </p>
      </header>

      <form className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto]">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome, gênero ou tag"
          className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        >
          <option value="">Todas as categorias</option>
          {categories.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_22px_rgba(147,51,234,0.45)]"
        >
          Filtrar
        </button>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        >
          <option value="newest">Mais recentes</option>
          <option value="popular">Mais jogados</option>
        </select>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/games"
          className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
            !category
              ? "border-purple-400/80 bg-purple-950/50 text-white"
              : "border-slate-700 bg-slate-950/60 text-slate-300 hover:text-white hover:border-purple-500"
          }`}
        >
          Todos
        </Link>
        {categories.map((entry) => (
          <Link
            key={entry}
            href={`/category/${slugify(entry)}`}
            className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300 hover:text-white hover:border-purple-500 transition-colors"
          >
            {entry}
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        {pagination.totalItems === 0
          ? "Nenhum jogo encontrado"
          : `Exibindo ${pagination.startItem}-${pagination.endItem} de ${pagination.totalItems} jogo(s)`}
      </p>

      {games.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
          Nenhum jogo encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-purple-500/70 hover:bg-slate-950/90 transition-colors"
            >
              <div className="relative aspect-video">
                <Image
                  src={game.thumbnail}
                  alt={game.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {game.category && (
                  <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-100 border border-white/10">
                    {game.category}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <h2 className="text-sm font-medium text-slate-100 line-clamp-2">
                  {game.title}
                </h2>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {game.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{game.views.toLocaleString("pt-BR")} views</span>
                  <span>{game.featured ? "Featured" : "HTML5"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm">
          <p className="text-slate-400">
            Página {pagination.currentPage} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            {pagination.hasPreviousPage ? (
              <Link
                href={buildPageHref("/games", pagination.currentPage - 1, baseParams)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Anterior
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-600">
                Anterior
              </span>
            )}
            {pagination.hasNextPage ? (
              <Link
                href={buildPageHref("/games", pagination.currentPage + 1, baseParams)}
                className="rounded-lg border border-purple-500/70 bg-purple-950/40 px-3 py-1.5 text-white transition-colors hover:bg-purple-950/70"
              >
                Próxima
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-600">
                Próxima
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}