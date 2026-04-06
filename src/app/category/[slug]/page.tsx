import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listCategories, listGamesPage } from "@/data/gamesStore";
import { slugify } from "@/lib/game-schema";
import { buildPageHref, getSingleQueryValue, resolvePagination } from "@/lib/pagination";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

async function findCategory(slug: string) {
  const categories = await listCategories();
  return categories.find((entry) => slugify(entry) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    return {
      title: "Categoria não encontrada",
      description: "A categoria solicitada não existe no catálogo atual.",
    };
  }

  return {
    title: `${category}`,
    description: `Jogos HTML5 da categoria ${category} no Arcade Nexus.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const category = await findCategory(slug);

  if (!category) {
    notFound();
  }

  const { page } = resolvePagination({
    page: getSingleQueryValue(resolvedSearchParams.page),
    defaultPageSize: 12,
  });

  const catalog = await listGamesPage({
    category,
    page,
    pageSize: 12,
    publishedOnly: true,
    sortBy: "popular",
  });

  const games = catalog.items;
  const pagination = catalog.pagination;
  const basePath = `/category/${slug}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-2">
        <Link href="/games" className="text-[11px] text-slate-400 hover:text-slate-200">
          ← Voltar ao catálogo
        </Link>
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Category Spotlight
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
          {category}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Descubra os jogos mais populares desta categoria e explore títulos
          publicados com carregamento instantâneo no navegador.
        </p>
        <p className="text-xs text-slate-500">
          {pagination.totalItems === 0
            ? "Nenhum jogo nesta categoria"
            : `Exibindo ${pagination.startItem}-${pagination.endItem} de ${pagination.totalItems} jogo(s)`}
        </p>
      </header>

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
            </div>
            <div className="p-3 space-y-1">
              <h2 className="text-sm font-medium text-slate-100 line-clamp-2">
                {game.title}
              </h2>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {game.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm">
          <p className="text-slate-400">
            Página {pagination.currentPage} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            {pagination.hasPreviousPage ? (
              <Link
                href={buildPageHref(basePath, pagination.currentPage - 1, {})}
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
                href={buildPageHref(basePath, pagination.currentPage + 1, {})}
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