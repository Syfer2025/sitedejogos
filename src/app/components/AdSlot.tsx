"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAdBlockDetected } from "./AdBlockDetector";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  label: string;
  slot?: string;
  minHeight?: number;
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/* ── Native fallback promos shown when adblock is active ── */
const NATIVE_PROMOS = [
  {
    title: "🎮 Crie sua conta e ganhe moedas!",
    text: "Registre-se grátis no Arcade Nexus e comece a ganhar moedas para desbloquear temas exclusivos.",
    cta: "Criar conta grátis",
    href: "/login?mode=register",
    gradient: "from-purple-500/20 to-cyan-500/20",
    border: "border-purple-500/30",
  },
  {
    title: "⭐ Torne-se Premium!",
    text: "Experiência sem anúncios, temas exclusivos e recompensas em dobro. Conheça o plano Premium.",
    cta: "Ver plano Premium",
    href: "/account",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    title: "🏆 Desafio diário disponível!",
    text: "Complete a missão de hoje e ganhe moedas, XP e suba no ranking entre seus amigos.",
    cta: "Ver missão",
    href: "/",
    gradient: "from-emerald-500/20 to-cyan-500/20",
    border: "border-emerald-500/30",
  },
  {
    title: "📰 Conteúdo exclusivo no Blog",
    text: "Dicas, listas e novidades sobre o mundo dos jogos HTML5. Confira os artigos mais populares.",
    cta: "Ler blog",
    href: "/blog",
    gradient: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/30",
  },
];

function NativePromo({ minHeight }: { minHeight: number }) {
  const promo = NATIVE_PROMOS[Math.floor(Math.random() * NATIVE_PROMOS.length)];

  return (
    <Link
      href={promo.href}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${promo.gradient} border ${promo.border} p-4 text-center transition-all duration-200 hover:scale-[1.01] hover:shadow-lg`}
      style={{ minHeight }}
    >
      <p className="text-sm font-bold text-slate-100">{promo.title}</p>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{promo.text}</p>
      <span className="mt-1 rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 border border-white/10 transition-colors hover:bg-white/15">
        {promo.cta}
      </span>
    </Link>
  );
}

export function AdSlot({ label, slot, minHeight = 160 }: AdSlotProps) {
  const canRenderAds = Boolean(ADSENSE_CLIENT_ID && slot);
  const adBlocked = useAdBlockDetected();
  const insRef = useRef<HTMLModElement>(null);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (!canRenderAds || typeof window === "undefined" || adBlocked) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      console.error("Falha ao inicializar anúncio");
    }

    // Check after a small delay if the ad was actually rendered
    const timer = setTimeout(() => {
      const el = insRef.current;
      if (el) {
        const rendered =
          el.offsetHeight > 0 &&
          el.querySelector("iframe, ins") !== null;
        if (!rendered) {
          setAdFailed(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canRenderAds, slot, adBlocked]);

  // When adblock is active or ad failed to render, show native promos
  const showNativeFallback = adBlocked || adFailed;

  return (
    <div className="my-4 w-full">
      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/70 px-3 py-3">
        {!showNativeFallback && (
          <div className="mb-2 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.18em] text-slate-500">
            <span>Publicidade</span>
            <span>{label}</span>
          </div>
        )}

        {showNativeFallback ? (
          <NativePromo minHeight={minHeight} />
        ) : canRenderAds ? (
          <ins
            ref={insRef}
            className="adsbygoogle block w-full overflow-hidden"
            style={{ minHeight }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div
            className="flex w-full items-center justify-center rounded-xl bg-slate-900/65 text-[11px] text-slate-400"
            style={{ minHeight }}
          >
            Configure NEXT_PUBLIC_ADSENSE_CLIENT_ID e informe o slot para exibir um anúncio real.
          </div>
        )}
      </div>
    </div>
  );
}