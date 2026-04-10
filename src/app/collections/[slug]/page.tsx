import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { SITE_CONFIG } from "@/lib/config";
import { Footer } from "../../components/Footer";
import { AdSlot } from "../../components/AdSlot";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Not Found" };

  return {
    title: `${collection.title} | Gasty Games`,
    description: collection.description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: `${SITE_CONFIG.url}/collections/${slug}`,
      type: "website",
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const games = await prisma.game.findMany({
    where: collection.where,
    orderBy: [{ views: "desc" }, { popularityScore: "desc" }],
    take: 60,
    select: {
      id: true, title: true, slug: true, thumbnail: true,
      category: true, featured: true,
    },
  });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: collection.title,
      description: collection.description,
      url: `${SITE_CONFIG.url}/collections/${slug}`,
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_CONFIG.url },
        { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE_CONFIG.url}/collections` },
        { "@type": "ListItem", position: 3, name: collection.title, item: `${SITE_CONFIG.url}/collections/${slug}` },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {structuredData.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <div className="max-w-7xl mx-auto px-4 py-8">

        <nav className="mb-4 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-300">Collections</span>
          <span className="mx-1.5">/</span>
          <span className="text-slate-300">{collection.h1}</span>
        </nav>

        <div className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{collection.emoji}</span>
            <h1 className="text-3xl font-bold text-white">{collection.h1}</h1>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">{collection.description}</p>
        </div>

        <AdSlot label="Collection Top" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />

        {games.length > 0 ? (
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
        ) : (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center">
            <span className="text-4xl">{collection.emoji}</span>
            <p className="mt-3 text-slate-400">No games found in this collection yet. Check back soon!</p>
          </div>
        )}

        <AdSlot label="Collection Bottom" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_CONTENT} />

        <div className="mt-12 pt-8 border-t border-slate-800/40">
          <Footer />
        </div>
      </div>
    </div>
  );
}
