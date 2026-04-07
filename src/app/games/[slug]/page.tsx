import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getGameBySlug, getGameRatingStats, getUserGameRating, listRelatedGames } from "@/data/gamesStore";
import { getPlayerGameState } from "@/data/playerStore";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { RelatedGamesSection } from "../../components/RelatedGames";
import { AdSlot } from "../../components/AdSlot";
import { FavoriteButton } from "../../components/FavoriteButton";
import { GamePlayer } from "../../components/GamePlayer";
import { GameComments } from "../../components/GameComments";
import { ShareButton } from "../../components/ShareButton";
import { StarRating } from "../../components/StarRating";
import { PlayerHistoryTracker } from "../../components/PlayerHistoryTracker";
import { GameViewTracker } from "../../components/GameViewTracker";
import { getCommentCount } from "@/data/socialStore";

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
      title: "Jogo não encontrado | Arcade Nexus",
      description: "Este jogo não está disponível no momento.",
    };
  }

  return {
    title: `${game.title} | Arcade Nexus`,
    description: game.description,
    openGraph: {
      title: game.title,
      description: game.description,
      images: [game.thumbnail],
      type: "website",
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug, true);

  if (!game) {
    notFound();
  }

  const relatedGames = await listRelatedGames(game, 4);
  const cookieStore = await cookies();
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const [playerState, commentCount, ratingStats, userRating] = await Promise.all([
    playerSession
      ? getPlayerGameState(playerSession.user.id, game.id)
      : Promise.resolve(null),
    getCommentCount(game.id),
    getGameRatingStats(game.id),
    playerSession
      ? getUserGameRating(playerSession.user.id, game.id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.title,
            description: game.description,
            image: game.thumbnail,
            url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/games/${game.slug}`,
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
          })
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
              HTML5 • Browser
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50 mb-2">
            {game.title}
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl mb-4">
            {game.description}
          </p>

          <GamePlayer
            iframeUrl={game.iframeUrl}
            title={game.title}
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

      </div>

      <AdSlot
        label="Banner inferior - Página de jogo"
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_BOTTOM}
        autoRefresh
        refreshIntervalMs={45000}
      />

      <RelatedGamesSection games={relatedGames} />
    </div>
  );
}
