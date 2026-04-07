"use client";

import { useEffect, useState } from "react";

type NitroPremiumBannerProps = {
  isAuthenticated: boolean;
  isPremium: boolean;
};

const SESSION_KEY = "arcadenexus_nitro_banner_dismissed";
const SHOW_AFTER_MS = 600_000; // 10 minutes

export function NitroPremiumBanner({
  isAuthenticated,
  isPremium,
}: NitroPremiumBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPremium) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setVisible(true);
      }
    }, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, [isPremium]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  if (!visible || isPremium) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9000] animate-slide-in-bottom">
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/95 to-slate-900/95 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-3xl shrink-0">⚡</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Nitro Premium</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isAuthenticated
                  ? "Remova todos os anuncios, ganhe moedas em dobro e desbloqueie temas exclusivos."
                  : "Crie sua conta e teste o Premium gratis por 3 dias. Sem anuncios, recompensas em dobro."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={isAuthenticated ? "/nitro" : "/login?mode=register&from=/nitro"}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white transition-all hover:from-purple-400 hover:to-cyan-400 active:scale-95"
              >
                {isAuthenticated ? "Assinar" : "Testar gratis"}
              </a>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-slate-600 px-2 py-2 text-xs text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
