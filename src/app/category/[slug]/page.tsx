import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { listGames, listCategories } from "@/data/gamesStore";

export const revalidate = 600; // 10 min — category pages update slowly
import { slugify } from "@/lib/game-schema";
import { getCategorySeoContent } from "@/lib/category-seo-content";
import { AdSlot } from "../../components/AdSlot";
import { SUPPORTED_LOCALES } from "@/lib/locale";
import { SITE_CONFIG } from "@/lib/config";
import { Footer } from "../../components/Footer";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = SITE_CONFIG.url;

async function findCategory(slug: string) {
  const categories = await listCategories({ order: "editorial" });
  return categories.find((entry) => slugify(entry) === slug) ?? null;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    return { title: "Categoria não encontrada | Gasty Games" };
  }

  const seo = getCategorySeoContent(category);
  const siteUrl = SITE_CONFIG.url;

  // Generate hreflang alternates for this specific category
  const languages: Record<string, string> = {};
  SUPPORTED_LOCALES.forEach((loc) => {
    languages[loc] = `${siteUrl}/category/${slug}?lang=${loc}`;
  });

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.h1,
      description: seo.description,
      type: "website",
    },
    alternates: {
      canonical: `/category/${slug}`,
      languages,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    notFound();
  }

  const games = await listGames({ category, publishedOnly: true, limit: 100, sortBy: "popular" });
  const seo = getCategorySeoContent(category);

  const structuredData = [
    // CollectionPage + ItemList
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seo.h1,
      description: seo.description,
      url: `${SITE_URL}/category/${slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: games.length,
        itemListElement: games.slice(0, 20).map((game, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/games/${game.slug}`,
          name: game.title,
        })),
      },
    },
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `Jogos de ${category}`, item: `${SITE_URL}/category/${slug}` },
      ],
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: seo.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {structuredData.map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}

        {/* Breadcrumb nav */}
        <nav className="mb-4 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-300">{category}</span>
        </nav>

        <div className="mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white mb-2">{seo.h1}</h1>
          <p className="text-sm text-slate-400 max-w-3xl">{seo.intro}</p>
        </div>

        <AdSlot label="Top Banner Categoria" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />

        {/* Benefits */}
        <div className="mb-6 flex flex-wrap gap-2">
          {seo.benefits.map((b) => (
            <span key={b} className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-[10px] text-slate-300">
              {b}
            </span>
          ))}
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 stagger-children">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group block overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:-translate-y-0.5 animate-fade-in-up"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <Image
                    src={game.thumbnail}
                    alt={game.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  {game.featured ? (
                    <span className="absolute left-2 top-2 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg">
                      destaque
                    </span>
                  ) : null}
                </div>
                <div className="px-2.5 py-2">
                  <h3 className="truncate text-xs font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
                    {game.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-10 text-center">
            <span className="text-3xl">🎮</span>
            <p className="mt-3 text-slate-400 font-medium">Nenhum jogo publicado nesta categoria ainda.</p>
          </div>
        )}

        <AdSlot label="Banner Meio Categoria" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_MIDDLE} />

        {/* FAQ Section */}
        <section className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-slate-200 mb-4">Perguntas frequentes sobre jogos de {category}</h2>
          <div className="space-y-3">
            {seo.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-slate-200 group-open:text-cyan-300 transition-colors">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* SEO text block */}
        <div className="mt-10 text-center text-sm text-slate-400 max-w-3xl mx-auto border-t border-slate-800 pt-8 p-6">
          <h2 className="text-lg font-bold text-slate-200 mb-3">Por que jogar {category} no Gasty Games?</h2>
          <p className="leading-relaxed">
            A secao de jogos de {category} foi criada baseada no que ha de mais moderno em renderizacao de navegador (HTML5/WebGL).
            Sem a necessidade de realizar downloads pesados e instalar APPs arriscados, voce se diverte instantaneamente em qualquer dispositivo.
          </p>
        </div>

        <AdSlot label="Banner Inferior Categoria" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_CONTENT} />

        {/* Footer inside scrolling area */}
        <div className="mt-12 pt-8 border-t border-slate-800/40">
          <Footer />
        </div>
      </div>
    </div>
  );
}
