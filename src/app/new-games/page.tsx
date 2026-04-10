import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/config";
import { Footer } from "../components/Footer";
import { AdSlot } from "../components/AdSlot";

export const revalidate = 3600; // refresh every hour

export const metadata: Metadata = {
  title: "New Games Online Free — Play Latest HTML5 Games | Gasty Games",
  description: "Discover the newest free online games added to Gasty Games. Play the latest HTML5 games instantly in your browser — no download needed.",
  alternates: { canonical: "/new-games" },
  openGraph: {
    title: "New Games — Gasty Games",
    description: "The latest free browser games, updated daily.",
    url: `${SITE_CONFIG.url}/new-games`,
    type: "website",
  },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

function dayLabel(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 6) return `${diff} days ago`;
  return formatDate(iso);
}

export default async function NewGamesPage() {
  const games = await prisma.game.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, title: true, slug: true, thumbnail: true,
      category: true, featured: true, createdAt: true,
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "New Games — Gasty Games",
    description: metadata.description,
    url: `${SITE_CONFIG.url}/new-games`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: games.slice(0, 20).map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_CONFIG.url}/games/${g.slug}`,
        name: g.title,
      })),
    },
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="max-w-7xl mx-auto px-4 py-8">

        <nav className="mb-4 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-300">New Games</span>
        </nav>

        <div className="mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white mb-2">New Games</h1>
          <p className="text-sm text-slate-400">
            The latest HTML5 games added to Gasty Games — updated daily, play free instantly.
          </p>
        </div>

        <AdSlot label="New Games Top" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 hover:border-cyan-400/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                <Image src={game.thumbnail} alt={game.title} fill unoptimized
                  className="object-fill transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute top-2 right-2 rounded bg-cyan-400/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
                  {dayLabel(game.createdAt.toISOString())}
                </span>
              </div>
              <div className="px-2.5 py-1.5">
                <h3 className="truncate text-[11px] font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
                  {game.title}
                </h3>
                <span className="text-[10px] text-slate-500">{game.category}</span>
              </div>
            </Link>
          ))}
        </div>

        <AdSlot label="New Games Bottom" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_CONTENT} />

        <div className="mt-12 pt-8 border-t border-slate-800/40">
          <Footer />
        </div>
      </div>
    </div>
  );
}
