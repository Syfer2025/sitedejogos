import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { listGames, listCategories } from "@/data/gamesStore";
import { slugify } from "@/lib/game-schema";
import { AdSlot } from "../../components/AdSlot";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

async function findCategory(slug: string) {
  const categories = await listCategories({ order: "editorial" });
  return categories.find((entry) => slugify(entry) === slug) ?? null;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    return { title: "Categoria não encontrada | Arcade Nexus" };
  }

  return {
    title: `Jogos de ${category} Online Grátis | Arcade Nexus`,
    description: `Jogue os melhores jogos de ${category} online grátis no Arcade Nexus. Centenas de opções em HTML5 direto no navegador para PC e celular!`,
    openGraph: {
      title: `Jogos de ${category} Online Grátis`,
      description: `Explore os melhores jogos de ${category} no Arcade Nexus. Jogue no navegador!`,
      type: "website",
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Jogos de {category}</h1>
          <p className="text-sm text-slate-400">
            Temos {games.length} jogo{games.length !== 1 ? 's' : ''} na categoria {category} para você jogar de graça no computador e celular.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <AdSlot label="Top Banner Categoria" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} />
      </div>

      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 stagger-children">
          {games.map(game => (
            <Link key={game.id} href={`/games/${game.slug}`} className="group block overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-200 hover:border-cyan-400/40 hover:-translate-y-0.5 animate-fade-in-up">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <Image src={game.thumbnail} alt={game.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                {game.featured ? (
                  <span className="absolute left-2 top-2 rounded bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-950 shadow-lg">
                    ★
                  </span>
                ) : null}
              </div>
              <div className="p-2.5">
                <h3 className="truncate text-[13px] font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">{game.title}</h3>
                <span className="text-[10px] text-slate-500 font-medium">👁 {new Intl.NumberFormat('pt-BR').format(game.views)} views</span>
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

      <div className="mt-16 text-center text-sm text-slate-400 max-w-3xl mx-auto border-t border-slate-800 pt-8 rounded-xl bg-slate-950/30 p-6">
        <h2 className="text-lg font-bold text-slate-200 mb-3">Por que jogar {category} no Arcade Nexus?</h2>
        <p className="leading-relaxed">
          A seção de jogos de {category} foi criada baseada no que há de mais moderno em renderização de navegador (HTML5/WebGL). 
          Sem a necessidade de realizar downloads pesados e instalar APPs arriscados, você se diverte instantaneamente em qualquer dispositivo.
        </p>
        <div className="mt-8">
            <AdSlot label="Banner Inferior da Categoria" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_MIDDLE} />
        </div>
      </div>
    </div>
  );
}