"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminGame = {
  id: string;
  title: string;
  slug: string;
  category: string;
  featured: boolean;
  views: number;
  isPublished: boolean;
  createdAt: string;
};

type FilterState = {
  query: string;
  category: string;
  featured: "all" | "true" | "false";
  published: "all" | "true" | "false";
  sort: "newest" | "popular";
};

const INITIAL_FILTERS: FilterState = {
  query: "",
  category: "all",
  featured: "all",
  published: "all",
  sort: "newest",
};

export default function AdminGamesPage() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams();

        if (filters.query.trim()) {
          searchParams.set("q", filters.query.trim());
        }

        if (filters.category !== "all") {
          searchParams.set("category", filters.category);
        }

        if (filters.featured !== "all") {
          searchParams.set("featured", filters.featured);
        }

        if (filters.published !== "all") {
          searchParams.set("published", filters.published);
        }

        searchParams.set("sort", filters.sort);

        const response = await fetch(`/api/admin/games?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error("Falha ao carregar jogos");
        }

        const data = (await response.json()) as AdminGame[];

        if (!active) {
          return;
        }

        setGames(data);
      } catch {
        if (!active) {
          return;
        }

        setError("Erro ao carregar lista de jogos");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [filters]);

  const categories = useMemo(() => {
    const unique = new Set(games.map((game) => game.category).filter(Boolean));
    return ["all", ...Array.from(unique).sort((left, right) => left.localeCompare(right))];
  }, [games]);

  const stats = useMemo(() => {
    const published = games.filter((game) => game.isPublished).length;
    const featured = games.filter((game) => game.featured).length;
    const totalViews = games.reduce((sum, game) => sum + game.views, 0);

    return {
      total: games.length,
      published,
      drafts: games.length - published,
      featured,
      totalViews,
    };
  }, [games]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            Games
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Gerencie catálogo, destaque, status de publicação e descubra rápido os
            jogos com mais tração no portal.
          </p>
        </div>

        <Link
          href="/admin/games/new"
          className="inline-flex items-center rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_18px_rgba(147,51,234,0.6)] transition-colors hover:bg-purple-500"
        >
          + Novo jogo
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Resultados</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Publicados</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Destaques</p>
          <p className="mt-2 text-2xl font-semibold text-purple-300">{stats.featured}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Views</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">
            {stats.totalViews.toLocaleString("pt-BR")}
          </p>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-[2fr,1fr,1fr,1fr,auto]">
        <input
          type="search"
          value={filters.query}
          onChange={(event) =>
            setFilters((current) => ({ ...current, query: event.target.value }))
          }
          placeholder="Buscar por título, categoria ou tag"
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        />

        <select
          value={filters.category}
          onChange={(event) =>
            setFilters((current) => ({ ...current, category: event.target.value }))
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "Todas as categorias" : category}
            </option>
          ))}
        </select>

        <select
          value={filters.featured}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              featured: event.target.value as FilterState["featured"],
            }))
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        >
          <option value="all">Todos os destaques</option>
          <option value="true">Só destacados</option>
          <option value="false">Sem destaque</option>
        </select>

        <select
          value={filters.published}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              published: event.target.value as FilterState["published"],
            }))
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
        >
          <option value="all">Todos os status</option>
          <option value="true">Publicados</option>
          <option value="false">Rascunhos</option>
        </select>

        <div className="flex gap-2">
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value as FilterState["sort"],
              }))
            }
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
          >
            <option value="newest">Mais recentes</option>
            <option value="popular">Mais populares</option>
          </select>
          <button
            type="button"
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
          >
            Limpar
          </button>
        </div>
      </section>

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-400">
        {loading && <p>Carregando jogos...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-2 text-left font-normal">Título</th>
                  <th className="px-2 py-2 text-left font-normal">Slug</th>
                  <th className="px-2 py-2 text-left font-normal">Categoria</th>
                  <th className="px-2 py-2 text-left font-normal">Featured</th>
                  <th className="px-2 py-2 text-left font-normal">Views</th>
                  <th className="px-2 py-2 text-left font-normal">Status</th>
                  <th className="py-2 pl-2 text-right font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="border-b border-slate-900 hover:bg-slate-900/60"
                  >
                    <td className="max-w-[220px] truncate py-2 pr-2 text-slate-100">
                      {game.title}
                    </td>
                    <td className="max-w-[180px] truncate px-2 py-2 text-slate-400">
                      {game.slug}
                    </td>
                    <td className="px-2 py-2 text-slate-300">{game.category || "-"}</td>
                    <td className="px-2 py-2">
                      {game.featured ? (
                        <span className="inline-flex items-center rounded-full border border-purple-400/60 bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-200">
                          Sim
                        </span>
                      ) : (
                        <span className="text-slate-500">Não</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-slate-300">{game.views}</td>
                    <td className="px-2 py-2">
                      {game.isPublished ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-600/80 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                          Rascunho
                        </span>
                      )}
                    </td>
                    <td className="space-x-2 py-2 pl-2 text-right">
                      <Link
                        href={`/admin/games/${game.id}/edit`}
                        className="text-[10px] text-slate-300 hover:text-slate-50"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}

                {games.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500">
                      Nenhum jogo encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}