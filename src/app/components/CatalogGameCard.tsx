import Image from "next/image";
import Link from "next/link";

type CatalogGameCardProps = {
  game: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    category: string;
    featured: boolean;
  };
  showCategoryBadge?: boolean;
};

export function CatalogGameCard({
  game,
  showCategoryBadge = false,
}: CatalogGameCardProps) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex flex-col aspect-[1.618] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-950/95 shadow-none"
    >
      <div className="relative flex-1 overflow-hidden bg-slate-950">
        <Image
          src={game.thumbnail}
          alt={game.title}
          fill
          unoptimized
          className="object-fill transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {game.featured ? (
          <span className="absolute right-3 top-3 rounded-full border border-amber-300/30 bg-amber-400/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
            destaque
          </span>
        ) : null}
      </div>

      <div className="px-2.5 py-1.5 flex-none bg-slate-900/40">
        <h3 className="line-clamp-1 text-[11px] font-semibold text-slate-100 transition-colors group-hover:text-white">
          {game.title}
        </h3>
      </div>
    </Link>
  );
}
