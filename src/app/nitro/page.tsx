import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nitro Premium | Arcade Nexus",
  description: "Assine o Nitro Premium e jogue sem anúncios, sem limites e sem espera.",
};

const PLANS = [
  {
    id: "monthly",
    name: "Mensal",
    price: "R$ 8,90",
    period: "/mês",
    badge: null,
    highlight: false,
    savings: null,
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: "R$ 22,90",
    period: "/3 meses",
    badge: "Popular",
    highlight: true,
    savings: "Economize 14%",
  },
  {
    id: "annual",
    name: "Anual",
    price: "R$ 79,90",
    period: "/ano",
    badge: "Melhor valor",
    highlight: false,
    savings: "Economize 25%",
  },
];

const BENEFITS = [
  {
    icon: "🚫",
    title: "Zero anúncios",
    desc: "Navegação e gameplay 100% livre de publicidade em todo o portal.",
    gradient: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/20",
  },
  {
    icon: "⚡",
    title: "Acesso instantâneo",
    desc: "Sem countdowns, sem telas de espera. Clicou, jogou.",
    gradient: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
  },
  {
    icon: "♾️",
    title: "Jogos ilimitados",
    desc: "Sem limite diário de jogos. Jogue o quanto quiser, sempre.",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    border: "border-purple-500/20",
  },
  {
    icon: "🏆",
    title: "XP em dobro",
    desc: "Ganhe 2x XP em todas as atividades e suba de nível mais rápido.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/20",
  },
  {
    icon: "🎨",
    title: "Temas exclusivos",
    desc: "Desbloqueie avatares, capas e temas visuais premium que só assinantes têm.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
  },
  {
    icon: "⭐",
    title: "Badge Nitro",
    desc: "Exiba o selo Nitro no seu perfil e no ranking para se destacar.",
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/20",
  },
];

const FAQ = [
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Cancele quando quiser, sem multa. Você mantém o acesso até o fim do período pago.",
  },
  {
    q: "Como funciona o XP em dobro?",
    a: "Toda ação que gera XP (jogar, completar missões, conquistas) rende o dobro enquanto sua assinatura estiver ativa.",
  },
  {
    q: "E se eu já tiver moedas compradas?",
    a: "Suas moedas são mantidas normalmente. O Nitro não afeta o saldo de moedas — são sistemas separados.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Cartão de crédito, débito, Pix e boleto (processamento de 1 a 3 dias úteis).",
  },
];

export default function NitroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 py-10">
      <div className="mx-auto max-w-4xl">

        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-500 to-cyan-400 shadow-[0_0_40px_rgba(168,85,247,0.6)] mb-4">
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-purple-300/80 font-semibold mb-2">
            Arcade Nexus
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Nitro <span className="bg-gradient-to-r from-amber-300 via-purple-400 to-cyan-300 bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto">
            A experiência definitiva no Arcade Nexus. Sem anúncios, sem limites, sem espera.
            Puro jogo.
          </p>
        </div>

        {/* ── Plans ── */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-slate-950/80 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                  : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className="text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {plan.name}
                </p>
                <p className="text-3xl font-black text-white mb-0.5">
                  {plan.price}
                </p>
                <p className="text-[11px] text-slate-500">
                  {plan.period}
                </p>
                {plan.savings && (
                  <p className="mt-2 text-[10px] font-semibold text-emerald-400">
                    {plan.savings}
                  </p>
                )}
              </div>

              <button
                type="button"
                className={`w-full mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_22px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]"
                    : "bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:text-white"
                }`}
              >
                Assinar {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* ── Benefits Card ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 shadow-[0_0_50px_rgba(15,23,42,0.9)] mb-10">
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/70 font-semibold mb-1">
              Tudo incluído
            </p>
            <h2 className="text-xl font-bold text-white">
              O que você ganha com o Nitro
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className={`group rounded-xl border ${b.border} bg-gradient-to-br ${b.gradient} p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <span className="text-2xl mb-2 block">{b.icon}</span>
                <p className="text-sm font-semibold text-white mb-1">{b.title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparison Table ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 shadow-[0_0_50px_rgba(15,23,42,0.9)] mb-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Grátis vs Nitro Premium
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recurso
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Grátis
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Nitro ⭐
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  ["Acesso a jogos", "✅ Todos", "✅ Todos"],
                  ["Anúncios", "Sim", "❌ Nenhum"],
                  ["Limite diário", "3 jogos (com adblock)", "♾️ Ilimitado"],
                  ["Countdown antes de jogar", "Até 30s", "⚡ Instantâneo"],
                  ["XP por atividade", "1×", "2× Dobro"],
                  ["Temas exclusivos", "❌", "✅ Acesso total"],
                  ["Badge no perfil", "❌", "⭐ Nitro Badge"],
                  ["Favoritos e histórico", "✅", "✅"],
                  ["Missões diárias", "✅", "✅ + bônus"],
                ].map(([feature, free, nitro]) => (
                  <tr key={feature} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-medium">{feature}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{free}</td>
                    <td className="py-3 px-4 text-center text-slate-200 font-medium">{nitro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 shadow-[0_0_50px_rgba(15,23,42,0.9)] mb-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 [&[open]]:border-purple-500/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-medium text-slate-200">{item.q}</span>
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45 text-lg">+</span>
                </summary>
                <div className="border-t border-slate-800 px-4 py-3">
                  <p className="text-[12px] text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="text-center rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/30 to-slate-950/80 p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
          <h2 className="text-2xl font-bold text-white mb-2">
            Pronto para jogar sem limites?
          </h2>
          <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
            Assine o Nitro Premium e transforme sua experiência no Arcade Nexus.
            Cancele quando quiser.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-8 py-3 text-base font-bold text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] hover:scale-[1.02] active:scale-[0.98]"
          >
            ⭐ Começar agora — R$ 8,90/mês
          </button>
          <p className="mt-3 text-[10px] text-slate-500">
            Pagamento seguro. Cancele a qualquer momento sem custos adicionais.
          </p>
        </div>

        {/* ── Back link ── */}
        <p className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Voltar ao portal
          </Link>
        </p>
      </div>
    </div>
  );
}
