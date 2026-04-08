"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type InterstitialContextValue = {
  showInterstitial: () => void;
  interstitialCount: number;
};

const InterstitialContext = createContext<InterstitialContextValue>({
  showInterstitial: () => {},
  interstitialCount: 0,
});

export function useInterstitial() {
  return useContext(InterstitialContext);
}

const SESSION_KEY = "arcadenexus_interstitial_count";
const MIN_INTERVAL_MS = 180_000; // 3 min between interstitials
const GAMEPLAY_INTERVAL_MS = 300_000; // 5 min gameplay trigger
const VIGNETTE_MAX_PER_SESSION = 3;

function getSessionCount(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(SESSION_KEY) || "0");
}

function incrementSessionCount(): number {
  const next = getSessionCount() + 1;
  sessionStorage.setItem(SESSION_KEY, String(next));
  return next;
}

type InterstitialProviderProps = {
  children: ReactNode;
  isPremium?: boolean;
};

export function InterstitialProvider({
  children,
  isPremium = false,
}: InterstitialProviderProps) {
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [count, setCount] = useState(0);
  const lastShownRef = useRef(0);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // Sync count from sessionStorage on mount
  useEffect(() => {
    setCount(getSessionCount());
  }, []);

  const showInterstitial = useCallback(() => {
    if (isPremium) return;
    if (active) return;
    if (Date.now() - lastShownRef.current < MIN_INTERVAL_MS) return;

    const currentCount = getSessionCount();

    setActive(true);
    setCountdown(5);
    lastShownRef.current = Date.now();
    const newCount = incrementSessionCount();
    setCount(newCount);
  }, [isPremium, active]);

  // Countdown timer
  useEffect(() => {
    if (!active || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, countdown, showNitroUpsell]);

  // Auto-dismiss when countdown finishes
  useEffect(() => {
    if (active && countdown === 0) {
      const timer = setTimeout(() => setActive(false), 300);
      return () => clearTimeout(timer);
    }
  }, [active, countdown, showNitroUpsell]);

  // Vignette: trigger on route change FROM /games/* to another page
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!prev.startsWith("/games/")) return;
    if (pathname === prev) return;
    if (getSessionCount() >= VIGNETTE_MAX_PER_SESSION) return;

    showInterstitial();
  }, [pathname, showInterstitial]);

  // Gameplay timer: trigger every 5 min while on a game page
  useEffect(() => {
    if (!pathname.startsWith("/games/") || isPremium) return;

    const timer = setInterval(() => {
      if (!document.hidden) showInterstitial();
    }, GAMEPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [pathname, isPremium, showInterstitial]);

  // Fullscreen exit trigger
  useEffect(() => {
    if (!pathname.startsWith("/games/") || isPremium) return;

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        // Small delay to avoid jarring UX
        setTimeout(() => showInterstitial(), 500);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [pathname, isPremium, showInterstitial]);

  function dismiss() {
    setActive(false);
  }

  return (
    <InterstitialContext.Provider value={{ showInterstitial, interstitialCount: count }}>
      {children}

      {/* Interstitial / Vignette Overlay */}
      {active && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          {/* ── Normal Interstitial Ad ── */}
          <div className="w-full max-w-lg mx-4 text-center">
            <div className="absolute top-4 right-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 border border-slate-800 tabular-nums">
              {countdown}s
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-4xl opacity-50">💰</span>
              <h3 className="text-xl font-bold text-slate-200">Espaço para Patrocinador</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Anuncio interstitial entre sessoes de jogo.
              </p>
              <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </InterstitialContext.Provider>
  );
}
