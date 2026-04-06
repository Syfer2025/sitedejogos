import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { getGameBySlug, listRelatedGames } from "@/data/gamesStore";
import { getPlayerGameState } from "@/data/playerStore";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

import { RelatedGamesSection } from "../../components/RelatedGames";
import { AdSlot } from "../../components/AdSlot";
import { FavoriteButton } from "../../components/FavoriteButton";
import { GamePlayer } from "../../components/GamePlayer";
import { GameComments } from "../../components/GameComments";
import { ShareButton } from "../../components/ShareButton";
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
  const [playerState, commentCount] = await Promise.all([
    playerSession
      ? getPlayerGameState(playerSession.user.id, game.id)
      : Promise.resolve(null),
    getCommentCount(game.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
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

          <GamePlayer iframeUrl={game.iframeUrl} title={game.title} />

          <AdSlot
            label="Banner superior - Página de jogo"
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP}
          />

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <FavoriteButton
              gameId={game.id}
              gameSlug={game.slug}
              initialFavorited={playerState?.favorited ?? false}
              isAuthenticated={Boolean(playerSession)}
            />
            <ShareButton title={game.title} text={game.description} />
            <span className="text-[11px] text-slate-500">
              💬 {commentCount} comentário{commentCount !== 1 ? "s" : ""}
            </span>
          </div>

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
      />

      <RelatedGamesSection games={relatedGames} />
    </div>
  );
}
