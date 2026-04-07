import Link from "next/link";
import type { Metadata } from "next";
import { NitroFreeTrialButton } from "../components/NitroFreeTrialButton";

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
    cta: "Assinar Mensal",
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: "R$ 22,90",
    period: "/3 meses",
    badge: "Popular",
    highlight: true,
    savings: "Economize 14%",
    cta: "Assinar Trimestral",
  },
  {
    id: "annual",
    name: "Anual",
    price: "R$ 79,90",
    period: "/ano",
    badge: "Melhor valor",
    highlight: false,
    savings: "Economize 25%",
    cta: "Assinar Anual",
  },
];

const FREE_FEATURES = [
  { icon: "✅", text: "Milhares de jogos gratuitos", available: true },
  { icon: "📢", text: "Anúncios em todo o portal", available: false },
  { icon: "⏳", text: "Telas de espera (até 30s)", available: false },
  { icon: "📉", text: "Ganho de XP padrão (1x)", available: true },
  { icon: "🚫", text: "Limite de 3 jogos/dia (AdBlock)", available: false },
  { icon: "❌", text: "Sem temas ou avatares premium", available: false },
  { icon: "❌", text: "Sem badge de apoiador", available: false },
];

const NITRO_FEATURES = [
  { icon: "✅", text: "Experiência 100% sem anúncios", highlight: true },
  { icon: "⚡", text: "Acesso instantâneo (Sem espera)", highlight: true },
  { icon: "🚀", text: "XP em Dobro (2x mais rápido)", highlight: true },
  { icon: "♾️", text: "Jogos ilimitados (Sem limites)", highlight: true },
  { icon: "🎨", text: "Temas e Avatares exclusivos", highlight: false },
  { icon: "⭐", text: "Badge Nitro no perfil e ranking", highlight: false },
  { icon: "💎", text: "Apoio direto ao desenvolvimento", highlight: false },
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
    q: "Quais formas de pagamento são aceitas?",
    a: "Cartão de crédito, débito, Pix e boleto (processamento de 1 a 3 dias úteis).",
  },
];

export default function NitroPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-purple-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
        
        {/* ── Hero ── */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-500 to-cyan-400 shadow-[0_0_50px_rgba(168,85,247,0.4)] mb-6 rotate-3">
            <span className="text-3xl font-black text-white drop-shadow-md">N</span>
          </div>
          <p className="text-[12px] uppercase tracking-[0.3em] text-purple-400 font-bold mb-3">
            Upgrade Experience
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            Nitro <span className="bg-gradient-to-r from-amber-200 via-purple-400 to-cyan-300 bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Elimine interrupções, mostre seu estilo e acelere seu progresso. 
            A versão definitiva do Arcade Nexus feita para jogadores de verdade.
          </p>
        </div>

        {/* ── Free Trial CTA ── */}
        <div className="mb-12 mx-auto max-w-xl animate-fade-in-up">
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-cyan-900/20 p-6 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
            <span className="text-3xl">🎁</span>
            <h3 className="mt-2 text-lg font-bold text-white">Teste gratis por 3 dias</h3>
            <p className="mt-1 text-sm text-slate-300">
              Experimente o Nitro Premium sem compromisso. Sem cartao de credito. Cancela automaticamente.
            </p>
            <NitroFreeTrialButton />
          </div>
        </div>

        {/* ── Pricing & Comparison Grid ── */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch mb-20 stagger-children">
          
          {/* Baseline: FREE Card */}
          <div className="flex flex-col rounded-3xl border border-slate-800/60 bg-slate-900/30 p-6 transition-all duration-300 hover:border-slate-700/80">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-100">Gratuito</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">R$ 0</span>
                <span className="text-sm text-slate-500">/sempre</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 uppercase tracking-tight">Experiência Padrão</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="shrink-0 text-sm">{f.icon}</span>
                  <span className={`text-[13px] leading-tight ${f.available ? "text-slate-300" : "text-slate-500"}`}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            <button disabled className="w-full rounded-xl bg-slate-800/50 py-3 text-sm font-semibold text-slate-400 cursor-default">
              Plano Atual
            </button>
          </div>

          {/* NITRO PLANS */}
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col rounded-3xl border transition-all duration-500 hover:-translate-y-2 ${
                plan.highlight
                  ? "border-purple-500/50 bg-gradient-to-b from-purple-900/20 via-slate-900/40 to-slate-950/90 shadow-[0_20px_50px_rgba(139,92,246,0.15)] ring-1 ring-purple-500/20"
                  : "border-slate-800/60 bg-slate-900/40 hover:border-purple-500/30"
              } p-6`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/30">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Nitro {plan.name}
                  {plan.highlight && <span className="text-amber-400">⭐</span>}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                {plan.savings ? (
                  <p className="mt-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block">
                    {plan.savings}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500 uppercase tracking-tight">Experiência Premium</p>
                )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {NITRO_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 text-sm filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{f.icon}</span>
                    <span className={`text-[13px] leading-tight font-medium ${f.highlight ? "text-slate-100" : "text-slate-300"}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`w-full rounded-2xl py-4 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.97] ${
                  plan.highlight
                    ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)]"
                    : "bg-white text-slate-950 font-bold hover:bg-slate-200"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ── FAQ Section ── */}
        <div className="max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">Dúvidas comuns</h2>
            <p className="mt-2 text-slate-400 text-sm">Tudo o que você precisa saber sobre o Arcade Nitro.</p>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-sm transition-all hover:border-slate-700/80 [&[open]]:border-purple-500/30 [&[open]]:bg-slate-900/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{item.q}</span>
                  <div className="relative h-5 w-5 shrink-0">
                    <div className="absolute top-1/2 left-0 h-0.5 w-5 -translate-y-1/2 bg-slate-500 rounded-full" />
                    <div className="absolute top-0 left-1/2 h-5 w-0.5 -translate-x-1/2 bg-slate-500 rounded-full transition-transform duration-300 group-open:rotate-90" />
                  </div>
                </summary>
                <div className="px-6 pb-5 pt-1">
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Security Badge ── */}
        <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-3xl border border-slate-800/40 bg-slate-900/10">
          <div className="flex items-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex flex-col items-center">
              <span className="text-2xl">🔒</span>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">SSL Secure</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-2xl">💳</span>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Safe Pay</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-2xl">⚡</span>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Fast Activation</span>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 text-center max-w-sm">
            Assinatura processada de forma segura. O acesso Premium é ativado instantaneamente após a confirmação do pagamento.
          </p>
        </div>

        {/* ── Footer Link ── */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span>←</span> Voltar ao portal
          </Link>
        </div>
      </div>
    </div>
  );
}
