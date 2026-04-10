"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  adFormat?: "auto" | "rectangle" | "vertical" | "sticky";
  isPremium?: boolean;
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5055044496746954";
const DEFAULT_SLOT_ID = "3126626506";
const MIN_REFRESH_INTERVAL = 30_000; // AdSense policy: minimum 30s

/* ── Native fallback promos shown when adblock is active ── */
const NATIVE_PROMOS = [
  {
    title: "🎮 Crie sua conta e ganhe moedas!",
    text: "Registre-se grátis no Gasty Games e comece a ganhar moedas para desbloquear temas exclusivos.",
    cta: "Criar conta grátis",
    href: "/login?mode=register",
    gradient: "from-purple-500/20 to-cyan-500/20",
    border: "border-purple-500/30",
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

function getPromoIndex(seed: string) {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % NATIVE_PROMOS.length;
}

function NativePromo({ minHeight, label }: { minHeight: number; label: string }) {
  const promo = NATIVE_PROMOS[getPromoIndex(`${label}:${minHeight}`)];

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

export function AdSlot({
  label,
  slot,
  minHeight = 160,
  autoRefresh = false,
  refreshIntervalMs = 45_000,
  adFormat = "auto",
  isPremium = false,
}: AdSlotProps) {
  // Se for premium, não renderiza publicidade nem ocupa espaço (Height = 0)
  if (isPremium) {
    return null;
  }

  const effectiveSlot = slot || DEFAULT_SLOT_ID;
  const canRenderAds = Boolean(ADSENSE_CLIENT_ID && effectiveSlot);
  const adBlocked = useAdBlockDetected();
  const insRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adFailed, setAdFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inView, setInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const interval = Math.max(refreshIntervalMs, MIN_REFRESH_INTERVAL);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "200px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const pushAd = useCallback(() => {
    if (!canRenderAds || typeof window === "undefined" || adBlocked) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // silent
    }
  }, [canRenderAds, adBlocked]);

  // Push ad on mount / refresh, BUT ONLY IF IN VIEW
  useEffect(() => {
    if (!inView) return;

    setIsLoaded(false);
    pushAd();

    const timer = setTimeout(() => {
      const el = insRef.current;
      if (el) {
        const rendered = el.offsetHeight > 0 && el.querySelector("iframe, ins") !== null;
        if (!rendered) {
          setAdFailed(true);
        } else {
          setIsLoaded(true);
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [pushAd, refreshKey, inView]);

  // Auto-refresh: increment key to force remount of <ins>
  useEffect(() => {
    if (!autoRefresh || !canRenderAds || adBlocked || !inView) return;

    const tick = setInterval(() => {
      // Pause refresh when tab is hidden (AdSense policy)
      if (document.hidden) return;
      setAdFailed(false);
      setRefreshKey((k) => k + 1);
    }, interval);

    return () => clearInterval(tick);
  }, [autoRefresh, canRenderAds, adBlocked, interval, inView]);

  const showNativeFallback = adBlocked || adFailed;

  const widthClass = adFormat === "vertical" ? "w-[300px] mx-auto" : "w-full";
  const stickyClass = adFormat === "sticky" ? "sticky top-[104px]" : "";

  return (
    <div ref={containerRef} className={`my-4 ${widthClass} ${stickyClass}`}>
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/70 p-3 flex flex-col justify-center">
        {!showNativeFallback && (
          <div className="absolute top-2 left-3 right-3 z-10 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.18em] text-slate-500 opacity-80 mix-blend-screen pointer-events-none">
            <span>Publicidade</span>
            <span>{label}</span>
          </div>
        )}

        {/* Anti-CLS Skeleton */}
        {!isLoaded && !showNativeFallback && canRenderAds && (
          <div 
            className="absolute inset-x-3 bottom-3 top-7 animate-pulse rounded-xl bg-slate-800/50" 
            style={{ minHeight: `${minHeight}px` }} 
          />
        )}

        <div className={`relative z-0 flex items-center justify-center w-full transition-opacity duration-500 ${isLoaded || showNativeFallback ? "opacity-100" : "opacity-0"}`} style={{ minHeight }}>
          {showNativeFallback ? (
            <NativePromo minHeight={minHeight} label={label} />
          ) : canRenderAds ? (
            <ins
              key={refreshKey}
              ref={insRef}
              className="adsbygoogle block w-full overflow-hidden"
              style={adFormat === "sticky" ? { minHeight: Math.max(minHeight, 600) } : { minHeight }}
              data-ad-client={ADSENSE_CLIENT_ID}
              data-ad-slot={effectiveSlot}
              data-ad-format={adFormat === "sticky" ? "vertical" : adFormat}
              data-full-width-responsive="true"
            />
          ) : (
            <div
              className="flex w-full h-full items-center justify-center rounded-xl bg-slate-900/65 text-[11px] text-slate-400 p-4 text-center"
              style={{ minHeight }}
            >
              Configure NEXT_PUBLIC_ADSENSE_CLIENT_ID e slot para exibir o Ad.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
