import Link from "next/link";

import { getAnalyticsOverview, getBlogFirstTractionMap } from "@/data/analyticsStore";
import { listAdminBlogPosts } from "@/data/blogPosts";

const SOURCE_LABELS: Record<string, string> = {
  "/": "Home",
  "/blog": "Listagem do blog",
  "/account": "Conta",
  "/notifications": "Notificações",
  notification: "Notificação push",
};

function formatPath(path: string) {
  return SOURCE_LABELS[path] ?? path;
}

function formatTractionTime(publishedAt: string, firstEventAt: Date): string {
  const pubMs = new Date(publishedAt).getTime();
  const eventMs = firstEventAt.getTime();
  const diffMs = eventMs - pubMs;
  if (diffMs < 0) return "Antes da publicação";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}min`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

const PERIOD_OPTIONS = [
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const windowDays = PERIOD_OPTIONS.some((o) => o.days === Number(params.days))
    ? Number(params.days)
    : 14;

  const blogPosts = await listAdminBlogPosts();
  const publishedSlugs = blogPosts
    .filter((p) => p.isPublished)
    .map((p) => p.slug);

  const [overview, firstTractionMap] = await Promise.all([
    getAnalyticsOverview(windowDays),
    getBlogFirstTractionMap(publishedSlugs),
  ]);
  const homeFunnelBlocks = overview.summary.homeFunnel.blocks.filter(
    (entry) =>
      entry.clicks > 0 ||
      entry.actionSessions > 0 ||
      entry.block === "hero" ||
      entry.block === "categories" ||
      entry.block === "recommended" ||
      entry.block === "blog",
  );
  const blogMetricsBySlug = new Map(
    overview.summary.blogPerformance.posts.map((entry) => [entry.slug, entry]),
  );
  const publishedBlogMetrics = blogPosts
    .filter((post) => post.isPublished)
    .map((post) => {
      const metric = blogMetricsBySlug.get(post.slug);

      return {
        post,
        impressions: metric?.impressions ?? 0,
        clicks: metric?.clicks ?? 0,
        views: metric?.views ?? 0,
        ctr: metric?.ctr ?? 0,
        clickToViewRate: metric?.clickToViewRate ?? 0,
        sources: metric?.sources ?? [],
      };
    })
    .sort(
      (left, right) =>
        right.clicks - left.clicks ||
        right.views - left.views ||
        right.impressions - left.impressions,
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
            Observabilidade
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Analytics internos do portal
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Janela dos últimos {overview.windowDays} dias com pageviews, funil da home,
            jogadas, aquisição e performance editorial do blog por post.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.days}
              href={`/admin/games/analytics?days=${option.days}`}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                windowDays === option.days
                  ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Pageviews</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {overview.summary.totals.pageViews.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Cliques na home</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200">
            {overview.summary.totals.homeClicks.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Impressões blog</p>
          <p className="mt-2 text-2xl font-semibold text-fuchsia-200">
            {overview.summary.totals.blogImpressions.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Cliques blog</p>
          <p className="mt-2 text-2xl font-semibold text-fuchsia-300">
            {overview.summary.totals.blogClicks.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Aberturas blog</p>
          <p className="mt-2 text-2xl font-semibold text-pink-300">
            {overview.summary.totals.blogViews.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">CTR blog</p>
          <p className="mt-2 text-2xl font-semibold text-pink-200">
            {overview.summary.totals.blogCtr.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Sessões únicas</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">
            {overview.summary.totals.uniqueSessions.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Jogadas</p>
          <p className="mt-2 text-2xl font-semibold text-purple-300">
            {overview.summary.totals.gameViews.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Cadastros</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {overview.summary.totals.playerRegistrations.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Logins</p>
          <p className="mt-2 text-2xl font-semibold text-sky-300">
            {overview.summary.totals.playerLogins.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Favoritos</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {overview.summary.totals.favoritesAdded.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Players totais</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {overview.lifetime.registeredPlayers.toLocaleString("pt-BR")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr,1fr,1fr,1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Evolução diária</h2>
            <span className="text-[11px] text-slate-500">Últimos {windowDays} dias</span>
          </div>
          <div className="space-y-3">
            {overview.summary.timeline.map((point) => {
              const maxValue = Math.max(
                ...overview.summary.timeline.map((entry) =>
                  entry.pageViews +
                  entry.homeClicks +
                  entry.blogClicks +
                  entry.blogViews +
                  entry.gameViews +
                  entry.playerRegistrations,
                ),
                1,
              );
              const ratio =
                ((point.pageViews +
                  point.homeClicks +
                  point.blogClicks +
                  point.blogViews +
                  point.gameViews +
                  point.playerRegistrations) /
                  maxValue) *
                100;

              return (
                <div key={point.date} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(point.date).toLocaleDateString("pt-BR")}</span>
                    <span>
                      {point.pageViews} pv • {point.blogClicks} blog • {point.blogViews} abert. • {point.gameViews} plays
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Top páginas</h2>
            <span className="text-[11px] text-slate-500">Pageviews</span>
          </div>
          <div className="space-y-3">
            {overview.summary.topPages.length === 0 ? (
              <p className="text-xs text-slate-500">Ainda não há dados suficientes.</p>
            ) : (
              overview.summary.topPages.map((entry) => (
                <div
                  key={entry.path}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <p className="text-sm font-medium text-slate-100">
                    {formatPath(entry.path)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.views.toLocaleString("pt-BR")} visualizações
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Top jogos</h2>
            <span className="text-[11px] text-slate-500">Engajamento</span>
          </div>
          <div className="space-y-3">
            {overview.summary.topGames.length === 0 ? (
              overview.topCatalogGames.map((game) => (
                <div
                  key={game.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <p className="text-sm font-medium text-slate-100">{game.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {game.views.toLocaleString("pt-BR")} views acumuladas
                  </p>
                </div>
              ))
            ) : (
              overview.summary.topGames.map((game) => (
                <div
                  key={game.gameId}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <p className="text-sm font-medium text-slate-100">{game.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {game.views.toLocaleString("pt-BR")} jogadas registradas
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Funil da home</h2>
            <span className="text-[11px] text-slate-500">
              Base: {overview.summary.homeFunnel.homeViews} view(s)
            </span>
          </div>
          <div className="space-y-3">
            {overview.summary.totals.homeClicks === 0 ? (
              <p className="text-xs text-slate-500">Ainda não há dados suficientes.</p>
            ) : (
              homeFunnelBlocks.map((entry) => (
                <div
                  key={entry.block}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{entry.label}</p>
                    <span className="text-[11px] text-slate-500">
                      {entry.shareOfHomeClicks.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      % dos cliques
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.clicks.toLocaleString("pt-BR")} clique(s) • {entry.uniqueSessions.toLocaleString("pt-BR")} sessão(ões) • {entry.conversionRate.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    % sobre views da home
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Jogada</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.playSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.playConversionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Favorito</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.favoriteSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.favoriteConversionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Aquisição direta</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.acquisitionSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.loginSessions.toLocaleString("pt-BR")} login(s) • {entry.registerSessions.toLocaleString("pt-BR")} cadastro(s)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.acquisitionConversionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Primeiro toque</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.firstAcquisitionSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.firstAcquisitionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Assistida</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.assistedAcquisitionSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.assistedAcquisitionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Ação total</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.actionSessions.toLocaleString("pt-BR")} sessão(ões)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {entry.actionConversionRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        % dos cliques com sessão
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400"
                      style={{ width: `${Math.max(entry.shareOfHomeClicks, entry.clicks > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Canais do blog</h2>
            <span className="text-[11px] text-slate-500">Impressões, cliques e aberturas</span>
          </div>
          <div className="space-y-3">
            {overview.summary.blogPerformance.topSources.length === 0 ? (
              <p className="text-xs text-slate-500">Ainda não há dados suficientes.</p>
            ) : (
              overview.summary.blogPerformance.topSources.map((source) => (
                <div
                  key={source.path}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{formatPath(source.path)}</p>
                    <span className="text-[11px] text-slate-500">
                      {source.ctr.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      % CTR
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {source.impressions.toLocaleString("pt-BR")} imp. • {source.clicks.toLocaleString("pt-BR")} cliques • {source.views.toLocaleString("pt-BR")} aberturas
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {source.clickToViewRate.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    % clique → abertura
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-50">Posts publicados</h2>
            <span className="text-[11px] text-slate-500">CTR por post</span>
          </div>
          <div className="space-y-3">
            {publishedBlogMetrics.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum post publicado ainda.</p>
            ) : (
              publishedBlogMetrics.map((entry) => (
                <div
                  key={entry.post.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{entry.post.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {entry.post.category} • {entry.post.readingTime} • {entry.post.slug}
                      </p>
                    </div>
                    <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-fuchsia-100">
                      {entry.ctr.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      % CTR
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Impressões</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.impressions.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Cliques</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.clicks.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Aberturas</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.views.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Clique → abertura</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {entry.clickToViewRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        %
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/65 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">1ª tração</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        {firstTractionMap[entry.post.slug]
                          ? formatTractionTime(entry.post.publishedAt, firstTractionMap[entry.post.slug])
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500">
                    {entry.sources.length > 0
                      ? entry.sources
                          .map(
                            (source) =>
                              `${formatPath(source.path)}: ${source.clicks} clique(s) / ${source.impressions} imp.`,
                          )
                          .join(" • ")
                      : "Sem impressões ou cliques capturados nessa janela."}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-50">Top interações da home</h2>
          <span className="text-[11px] text-slate-500">Paths brutos</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.summary.topHomeInteractions.length === 0 ? (
            <p className="text-xs text-slate-500">Ainda não há dados suficientes.</p>
          ) : (
            overview.summary.topHomeInteractions.map((entry) => (
              <div
                key={entry.path}
                className="rounded-2xl border border-slate-800 bg-slate-900/55 px-3 py-3"
              >
                <p className="text-sm font-medium text-slate-100">{formatPath(entry.path)}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {entry.clicks.toLocaleString("pt-BR")} clique(s)
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}