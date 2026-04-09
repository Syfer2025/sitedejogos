import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getGameBySlug, getGameRatingStats, getUserGameRating, listRelatedGames } from "@/data/gamesStore";
import { getPlayerGameState } from "@/data/playerStore";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { getDictionary, t } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME, resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/game-schema";

import { GameViewTracker } from "../../components/GameViewTracker";
import { GameWalkthrough } from "../components/GameWalkthrough";
import { SITE_CONFIG } from "@/lib/config";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug, true);

  if (!game) {
    return {
      title: "Jogo não encontrado | Gasty Games",
      description: "Este jogo não está disponível no momento.",
    };
  }

  const siteUrl = SITE_CONFIG.url;
  
  // Generate hreflang alternates for this specific game
  const languages: Record<string, string> = {};
  SUPPORTED_LOCALES.forEach((loc) => {
    languages[loc] = `${siteUrl}/games/${game.slug}?lang=${loc}`;
  });

  return {
    title: game.title,
    description: game.description || `Jogue ${game.title} online e grátis no Gasty Games. Aproveite o melhor de ${game.category} diretamente no seu navegador.`,
    alternates: {
      canonical: `/games/${game.slug}`,
      languages,
    },
    openGraph: {
      title: game.title,
      description: game.description,
      images: [game.thumbnail],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: game.title,
      description: game.description,
      images: [game.thumbnail],
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug, true);

  if (!game) {
    notFound();
  }

  const relatedGames = await listRelatedGames(game, 11);
  const cookieStore = await cookies();
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const initialLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(initialLocale);
  const siteUrl = SITE_CONFIG.url;

  const [ratingStats, userRating, playerState, commentCount] = await Promise.all([
    getGameRatingStats(game.id),
    playerSession ? getUserGameRating(playerSession.user.id, game.id) : null,
    playerSession ? getPlayerGameState(playerSession.user.id, game.id) : null,
    prisma.gameComment.count({ where: { gameId: game.id, isHidden: false } }),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": game.category,
          "item": `${siteUrl}/category/${slugify(game.category)}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": game.title,
          "item": `${siteUrl}/games/${game.slug}`
        }
      ]
    },
  // Parse FAQ for schema and UI
  let faqSchemaItems: any[] = [];
  try {
    if (game.faqJson) {
      const parsedFaq = JSON.parse(game.faqJson);
      if (Array.isArray(parsedFaq)) {
        faqSchemaItems = parsedFaq.map((item: any) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }));
      }
    }
  } catch (e) {
    console.error("Failed to parse faqJson for game", game.slug);
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": game.category,
          "item": `${siteUrl}/category/${slugify(game.category)}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": game.title,
          "item": `${siteUrl}/games/${game.slug}`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": ["VideoGame", "SoftwareApplication"],
      name: game.title,
      description: game.description,
      image: game.thumbnail,
      url: `${siteUrl}/games/${game.slug}`,
      genre: game.category,
      playMode: "SinglePlayer",
      applicationCategory: "Game",
      operatingSystem: "WebBrowser",
      ...(ratingStats.ratingCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: ratingStats.avgRating,
              ratingCount: ratingStats.ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
    ...(faqSchemaItems.length > 0
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqSchemaItems
        }]
      : [])
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }}
      />
      <GameViewTracker slug={game.slug} />
      <PlayerHistoryTracker gameId={game.id} />

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex-[1.4] min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-400">
            {game.category && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40">
                {game.category}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80">
              {t(dict, "game.htmlBrowser")}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50 mb-2">
            {game.title}
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl mb-4">
            {game.description}
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <AdSlot
                  label="Banner Top - Hero"
                  slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP}
                  autoRefresh
                  refreshIntervalMs={60000}
                  minHeight={90}
                />
              </div>

              <GamePlayer
                iframeUrl={game.iframeUrl}
                title={game.title}
                isPremium={playerSession?.user.isPremium}
                toolbarExtra={
                  <>
                    <StarRating
                      gameId={game.id}
                      gameSlug={game.slug}
                      avgRating={ratingStats.avgRating}
                      ratingCount={ratingStats.ratingCount}
                      initialUserRating={userRating?.value ?? 0}
                      isAuthenticated={Boolean(playerSession)}
                      size="sm"
                    />
                    <div className="h-5 w-px bg-slate-700 shrink-0" />
                    <FavoriteButton
                      gameId={game.id}
                      gameSlug={game.slug}
                      initialFavorited={playerState?.favorited ?? false}
                      isAuthenticated={Boolean(playerSession)}
                    />
                    <ShareButton title={game.title} text={game.description} />
                    <span className="text-[11px] text-slate-500 ml-auto shrink-0">
                      💬 {commentCount}
                    </span>
                  </>
                }
              />

              {/* Game Guide Section for SEO */}
              {(game.longDescription || game.controls || game.tips || faqSchemaItems.length > 0) && (
                <div className="mt-8 space-y-8 border-t border-slate-800/60 pt-8">
                  {game.longDescription && (
                    <article className="prose prose-invert prose-slate max-w-none">
                      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {t(dict, "game.aboutGame")}
                      </h2>
                      <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {game.longDescription}
                      </div>
                    </article>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {game.controls && (
                      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5">
                        <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                          🎮 {t(dict, "game.controls")}
                        </h2>
                        <div className="text-sm text-slate-400 leading-normal">
                          {game.controls}
                        </div>
                      </div>
                    )}
                    {game.tips && (
                      <div className="rounded-2xl border border-amber-900/20 bg-amber-950/5 p-5">
                        <h2 className="text-[13px] font-bold uppercase tracking-wider text-amber-200 mb-4 flex items-center gap-2">
                          💡 {t(dict, "game.tips")}
                        </h2>
                        <div className="text-sm text-slate-400 leading-normal">
                          {game.tips}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FAQ Section */}
                  {faqSchemaItems.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        {t(dict, "common.faq")}
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {faqSchemaItems.map((item, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-4">
                            <h3 className="text-sm font-medium text-slate-200 mb-1">{item.name}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{item.acceptedAnswer.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <GameWalkthrough
                gameId={"4kci7og3klgj0ivy2wz3gdvd9dth5e7n"}
                color="#3f007e"
                height="480px"
                showAds={!playerSession?.user.isPremium}
              />

              <AdSlot
                label="Banner superior - Página de jogo"
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP}
                autoRefresh
                refreshIntervalMs={45000}
              />

              {/* Comments */}
              <div className="mt-4">
                <GameComments
                  gameId={game.id}
                  isAuthenticated={Boolean(playerSession)}
                />
              </div>
            </div>

            {/* Right Sidebar Ad */}
            <aside className="hidden md:block w-[300px] shrink-0 self-start sticky top-32">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 text-center">Espaço Patrocinado</p>
                <AdSlot
                  label="Sidebar Skyscraper"
                  slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR}
                  minHeight={350}
                  autoRefresh
                  refreshIntervalMs={60000}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <AdSlot
        label="Banner inferior - Página de jogo"
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_BOTTOM}
        autoRefresh
        refreshIntervalMs={45000}
      />

      <RelatedGamesSection games={relatedGames} dict={dict} />
    </div>
  );
}
