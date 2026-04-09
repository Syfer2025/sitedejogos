import Image from "next/image";
import Link from "next/link";

export type RelatedGame = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category?: string;
};

export function RelatedGamesSection({ games }: { games: RelatedGame[] }) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 md:mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">
          You may also like
        </h2>
        <Link
          href="/#catalogo"
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          View more
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="group relative rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/70 hover:bg-slate-950/90 transition-colors shadow-none"
          >
            <div className="relative aspect-video overflow-hidden">
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
            <div className="p-3">
              <h3 className="text-[11px] font-medium text-slate-100 line-clamp-2 mb-0.5">
                {game.title}
              </h3>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                Play in one click
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
