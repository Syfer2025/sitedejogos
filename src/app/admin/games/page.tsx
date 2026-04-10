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

type FeedSyncFormState = {
  page: string;
  pages: string;
  maxItems: string;
};

type FeedSyncPageSummary = {
  page: number;
  totalFetched: number;
  totalPrepared: number;
  created: number;
  updated: number;
  skipped: number;
};

type FeedSyncBatchResult = {
  source: string;
  startPage: number;
  pageCount: number;
  totalFetched: number;
  totalPrepared: number;
  created: number;
  updated: number;
  skipped: number;
  results: FeedSyncPageSummary[];
};

const INITIAL_FILTERS: FilterState = {
  query: "",
  category: "all",
  featured: "all",
  published: "all",
  sort: "newest",
};

const INITIAL_FEED_SYNC_FORM: FeedSyncFormState = {
  page: "1",
  pages: "1",
  maxItems: "0",
};

export default function AdminGamesPage() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [feedSyncForm, setFeedSyncForm] = useState<FeedSyncFormState>(INITIAL_FEED_SYNC_FORM);
  const [feedSyncResult, setFeedSyncResult] = useState<FeedSyncBatchResult | null>(null);
  const [feedSyncError, setFeedSyncError] = useState<string | null>(null);
  const [syncingFeed, setSyncingFeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

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
  }, [filters, reloadToken]);

  async function handleFeedSync(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSyncingFeed(true);
      setFeedSyncError(null);
      setFeedSyncResult(null);

      const response = await fetch("/api/admin/games/sync/gamemonetize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page: Number(feedSyncForm.page) || 1,
          pages: Number(feedSyncForm.pages) || 1,
          maxItems: Number(feedSyncForm.maxItems) || 0,
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        const errorMessage = data?.error || "Falha ao sincronizar feed externo.";
        const errorDetails = data?.details ? ` (${data.details})` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      setFeedSyncResult(data as FeedSyncBatchResult);
      setReloadToken((current) => current + 1);
    } catch (syncError) {
      setFeedSyncError(
        syncError instanceof Error
          ? syncError.message
          : "Falha ao sincronizar feed externo.",
      );
    } finally {
      setSyncingFeed(false);
    }
  }

  const [fillingContent, setFillingContent] = useState(false);
  const [fillContentResult, setFillContentResult] = useState<{ filled: number; message: string } | null>(null);
  const [fillContentError, setFillContentError] = useState<string | null>(null);

  async function handleFillContent() {
    try {
      setFillingContent(true);
      setFillContentError(null);
      setFillContentResult(null);

      const res = await fetch("/api/admin/games/fill-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao preencher conteúdo.");
      setFillContentResult(data);
    } catch (err) {
      setFillContentError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setFillingContent(false);
    }
  }

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

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-cyan-400">
              Feed externo
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-50">
              Sincronizar GameMonetize
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-400">
              Importe páginas novas do feed sem rodar script manual. O sync é incremental,
              deduplica por origem externa e atualiza jogos já importados quando houver mudança.
            </p>
          </div>
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-cyan-200">
            Sync seguro por página
          </div>
        </div>

        <form
          onSubmit={handleFeedSync}
          className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]"
        >
          <label className="space-y-1 text-[11px] text-slate-400">
            <span>Página inicial</span>
            <input
              type="number"
              min={1}
              value={feedSyncForm.page}
              onChange={(event) =>
                setFeedSyncForm((current) => ({ ...current, page: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
            />
          </label>

          <label className="space-y-1 text-[11px] text-slate-400">
            <span>Quantidade de páginas</span>
            <input
              type="number"
              min={1}
              max={10}
              value={feedSyncForm.pages}
              onChange={(event) =>
                setFeedSyncForm((current) => ({ ...current, pages: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
            />
          </label>

          <label className="space-y-1 text-[11px] text-slate-400">
            <span>Limite por página</span>
            <input
              type="number"
              min={0}
              max={2000}
              value={feedSyncForm.maxItems}
              onChange={(event) =>
                setFeedSyncForm((current) => ({ ...current, maxItems: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
            />
          </label>

          <button
            type="submit"
            disabled={syncingFeed}
            className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_18px_rgba(8,145,178,0.45)] transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-900/60 disabled:text-cyan-100/70"
          >
            {syncingFeed ? "Sincronizando..." : "Sincronizar feed"}
          </button>
        </form>

        <p className="mt-2 text-[11px] text-slate-500">
          Use 0 em limite por página para importar a página inteira. O painel limita a 10 páginas por operação.
        </p>

        {feedSyncError ? (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {feedSyncError}
          </p>
        ) : null}

        {feedSyncResult ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Novos jogos</p>
                <p className="mt-2 text-xl font-semibold text-emerald-300">{feedSyncResult.created}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Atualizados</p>
                <p className="mt-2 text-xl font-semibold text-cyan-300">{feedSyncResult.updated}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Ignorados</p>
                <p className="mt-2 text-xl font-semibold text-amber-300">{feedSyncResult.skipped}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Itens lidos</p>
                <p className="mt-2 text-xl font-semibold text-slate-50">{feedSyncResult.totalFetched}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-300">
                Sync concluído de {feedSyncResult.pageCount} página(s), começando em {feedSyncResult.startPage}. Foram preparados {feedSyncResult.totalPrepared} item(ns) válidos para importação.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                {feedSyncResult.results.map((pageResult) => (
                  <span
                    key={pageResult.page}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1"
                  >
                    Pág. {pageResult.page}: {pageResult.created} novos, {pageResult.updated} atualizados, {pageResult.skipped} ignorados
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Fill Game Content ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">
          Preencher Conteúdo SEO
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Preenche automaticamente <code className="text-cyan-300">longDescription</code>, <code className="text-cyan-300">controls</code>, <code className="text-cyan-300">tips</code> e <code className="text-cyan-300">faqJson</code> para todos os jogos que estão vazios. Usa templates por categoria — zero custo, instantâneo.
        </p>
        <button
          type="button"
          onClick={handleFillContent}
          disabled={fillingContent}
          className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
        >
          {fillingContent ? "Preenchendo..." : "Preencher Todos os Jogos"}
        </button>

        {fillContentError && (
          <p className="mt-2 text-xs text-red-400">{fillContentError}</p>
        )}
        {fillContentResult && (
          <p className="mt-2 text-xs text-emerald-400">
            {fillContentResult.message}
          </p>
        )}
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