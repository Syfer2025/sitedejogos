import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plano descontinuado | Gasty Games",
  description: "O plano Nitro não está mais disponível no Gasty Games.",
};

import { Footer } from "../components/Footer";

export default function NitroPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <main className="min-h-[60vh] bg-[#020617] text-slate-100 flex items-center justify-center px-4 py-16 animate-fade-in">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Plano Nitro descontinuado
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            O antigo plano Nitro Premium não está mais disponível. Continuamos trabalhando em novas formas de
            oferecer uma experiência cada vez melhor no Gasty Games.
          </p>
          <p className="text-xs text-slate-500">
            Se você já teve acesso premium no passado, pode continuar jogando normalmente — nenhum jogo foi removido.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-slate-900/80 transition-colors"
            >
              <span>←</span>
              Voltar ao portal
            </Link>
          </div>
        </div>
      </main>
      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}
