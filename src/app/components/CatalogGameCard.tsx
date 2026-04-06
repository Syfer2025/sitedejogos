import Image from "next/image";
import Link from "next/link";

import { CatalogCategoryIcon, getCatalogCategoryPresentation } from "@/lib/catalog-category-presentation";

type CatalogGameCardProps = {
  game: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    description: string;
    category: string;
    views: number;
    featured: boolean;
  };
  showCategoryBadge?: boolean;
};

export function CatalogGameCard({
  game,
  showCategoryBadge = true,
}: CatalogGameCardProps) {
  const presentation = getCatalogCategoryPresentation(game.category);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-950/95 hover:shadow-[0_18px_50px_rgba(2,6,23,0.32)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <Image
          src={game.thumbnail}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {showCategoryBadge && game.category ? (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${presentation.chipClassName}`}
          >
            <CatalogCategoryIcon category={game.category} className="h-3.5 w-3.5" />
            {game.category}
          </span>
        ) : null}

        {game.featured ? (
          <span className="absolute right-3 top-3 rounded-full border border-amber-300/30 bg-amber-400/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
            destaque
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-100 transition-colors group-hover:text-white">
          {game.title}
        </h3>
        <p className="line-clamp-2 text-[11px] text-slate-400">
          {game.description}
        </p>
        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500">
          <span>{game.views.toLocaleString("pt-BR")} views</span>
          <span className="uppercase tracking-[0.14em] text-slate-500/90">
            {game.featured ? "portal pick" : "html5"}
          </span>
        </div>
      </div>
    </Link>
  );
}