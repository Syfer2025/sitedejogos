import Image from "next/image";
import Link from "next/link";
import React from "react";
import { t } from "@/lib/i18n";
import { AdSlot } from "./AdSlot";

export type RelatedGame = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category?: string;
};

export function RelatedGamesSection({ games, dict }: { games: RelatedGame[], dict: any }) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 md:mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">
          {t(dict, "game.youMayAlsoLike")}
        </h2>
        <Link
          href="/#catalogo"
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          {t(dict, "common.viewMore")}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {games.map((game, index) => (
          <React.Fragment key={game.id}>
          {index === 4 && (
            <div className="group relative rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800/80 p-2 flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase text-slate-500 mb-1">Patrocinado</span>
              <div className="w-full h-full flex items-center justify-center min-h-[140px] overflow-hidden">
                <AdSlot
                  label="In-Feed Ad"
                  slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED}
                  autoRefresh
                  refreshIntervalMs={60000}
                />
              </div>
            </div>
          )}
          <Link
            href={`/games/${game.slug}`}
            className="group flex flex-col aspect-[2/1] relative rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/70 hover:bg-slate-950/90 transition-colors shadow-none"
          >
            <div className="relative flex-1 overflow-hidden">
              <Image
                src={game.thumbnail}
                alt={game.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              {game.category && (
                <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200 border border-white/10">
                  {game.category}
                </span>
              )}
            </div>
            <div className="p-2 flex-none bg-slate-900/40">
              <h3 className="text-[10px] font-medium text-slate-100 line-clamp-1 mb-0.5">
                {game.title}
              </h3>
              <p className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors">
                {t(dict, "game.playInOneClick")}
              </p>
            </div>
          </Link>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
