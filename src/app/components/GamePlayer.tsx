"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdBlock } from "./AdBlockDetector";
import { AntiAdBlockWall } from "./AntiAdBlockWall";

type FullscreenContainer = HTMLDivElement & {
  webkitRequestFullscreen?: () => void;
};

type GamePlayerProps = {
  iframeUrl: string;
  title: string;
};

export function GamePlayer({ iframeUrl, title }: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { detected, level } = useAdBlock();

  // Game player phases
  const [hasStarted, setHasStarted] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);

  // Anti-adblock wall state (for hard level)
  const [wallDismissed, setWallDismissed] = useState(false);
  const showWall = detected && level === "hard" && !wallDismissed;

  const handleFullscreen = () => {
    const container = containerRef.current as FullscreenContainer | null;
    if (!container) return;

    if (container.requestFullscreen) {
      void container.requestFullscreen();
      return;
    }

    container.webkitRequestFullscreen?.();
  };

  const handleStartGame = () => {
    // If hard-level wall is showing, don't start
    if (showWall) return;
    setIsShowingAd(true);
    setAdCountdown(5);
  };

  const handleWallAllow = useCallback(() => {
    setWallDismissed(true);
  }, []);

  useEffect(() => {
    if (isShowingAd && adCountdown > 0) {
      const timer = setTimeout(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isShowingAd && adCountdown === 0) {
      setIsShowingAd(false);
      setHasStarted(true);
    }
  }, [isShowingAd, adCountdown]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 px-4 py-2 text-xs font-medium text-slate-200 border border-slate-700 transition-all min-h-[40px]"
          >
            ⛶ Tela cheia
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Pressione Esc para sair
          </span>
        </div>

        {/* Premium / Ad-Free Button */}
        <a
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 px-4 py-2 text-xs font-bold text-amber-500 border border-amber-500/30 transition-all min-h-[40px]"
        >
          Remover Anúncios
        </a>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-[0_0_35px_rgba(15,23,42,0.9)] aspect-[16/10] sm:aspect-video w-full"
      >
        {/* Anti-AdBlock Wall (hard level) — shown over start screen */}
        {showWall && (
          <div className="absolute inset-0 z-40">
            <AntiAdBlockWall onAllow={handleWallAllow} />
          </div>
        )}

        {/* Phase 1: Wait for Engagement */}
        {!hasStarted && !isShowingAd && !showWall && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.15),transparent_60%),linear-gradient(135deg,#020617,#0f172a)] backdrop-blur-sm">
            <button
              onClick={handleStartGame}
              className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 p-1 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)]"
            >
              <div className="flex items-center gap-3 rounded-xl bg-slate-950/50 px-8 py-4 backdrop-blur-md">
                <span className="text-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">▶</span>
                <span className="text-xl font-bold tracking-tight text-white">Carregar Jogo</span>
              </div>
            </button>
            <p className="mt-4 text-[11px] text-slate-500 uppercase tracking-widest font-medium">Ao jogar, você assiste um breve anúncio e apoia o portal</p>
          </div>
        )}

        {/* Phase 2: Show Pseudo Ad / Interstitial */}
        {isShowingAd && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
            <div className="absolute top-4 right-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 border border-slate-800 font-tabular-nums">
              Anúncio: {adCountdown}s
            </div>

            <div className="flex flex-col items-center text-center max-w-sm px-6">
              <span className="text-4xl mb-4 opacity-50 shrink-0">💰</span>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Espaço para Patrocinador</h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                Sua API do AdSense For Games (H5) injetará um vídeo ou interstitial interativo nesta tela antes de liberar o iframe.
              </p>

              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Actual Game */}
        {hasStarted && (
          <>
            {!loaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-400 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
                  <p className="text-xs text-slate-400 animate-pulse font-medium tracking-wide">Iniciando motor do jogo...</p>
                </div>
              </div>
            )}

            <iframe
              src={iframeUrl}
              title={title}
              className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
              allowFullScreen
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </>
        )}
      </div>
    </>
  );
}