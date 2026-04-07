"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAdBlock } from "./AdBlockDetector";
import { AntiAdBlockWall } from "./AntiAdBlockWall";

type FullscreenContainer = HTMLDivElement & {
  webkitRequestFullscreen?: () => void;
};

type GamePlayerProps = {
  iframeUrl: string;
  title: string;
  toolbarExtra?: ReactNode;
};

const CONTROLS_INFO = [
  { keys: "← → ↑ ↓", label: "Movimentar" },
  { keys: "W A S D", label: "Movimentar (alternativo)" },
  { keys: "Espaço", label: "Pular / Atirar" },
  { keys: "Enter", label: "Confirmar / Pausar" },
  { keys: "Esc", label: "Menu / Sair" },
  { keys: "Mouse", label: "Mirar / Interagir" },
  { keys: "Clique", label: "Selecionar / Atirar" },
];

export function GamePlayer({ iframeUrl, title, toolbarExtra }: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { detected, level } = useAdBlock();

  const [hasStarted, setHasStarted] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

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

  const handleMute = () => {
    setMuted((prev) => !prev);
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "mute", muted: !muted },
        "*"
      );
    } catch {
      // Cross-origin — no-op
    }
  };

  const handleStartGame = () => {
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

  useEffect(() => {
    if (!showControls) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowControls(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showControls]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-[0_0_35px_rgba(15,23,42,0.9)] aspect-[16/10] sm:aspect-video w-full"
      >
        {/* Anti-AdBlock Wall (hard level) */}
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
            <p className="mt-4 text-[11px] text-slate-500 uppercase tracking-widest font-medium">
              Ao jogar, você assiste um breve anúncio e apoia o portal
            </p>
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
              ref={iframeRef}
              src={iframeUrl}
              title={title}
              className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
              allowFullScreen
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />

            {muted && (
              <div className="absolute inset-0 z-[5] pointer-events-none">
                <div className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-red-400 font-bold uppercase tracking-wider border border-red-500/30">
                  🔇 Mudo
                </div>
              </div>
            )}
          </>
        )}

        {/* Controls Dropdown — centered in the game frame */}
        {showControls && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-200">
                  Controles
                </h3>
                <button
                  type="button"
                  onClick={() => setShowControls(false)}
                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Fechar ✕
                </button>
              </div>
              <div className="space-y-2">
                {CONTROLS_INFO.map((ctrl) => (
                  <div
                    key={ctrl.keys}
                    className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2"
                  >
                    <span className="text-xs font-mono font-bold text-cyan-300 tracking-wide">
                      {ctrl.keys}
                    </span>
                    <span className="text-xs text-slate-400">{ctrl.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-500 text-center">
                Os controles podem variar dependendo do jogo
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Single toolbar — everything in one line */}
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 overflow-x-auto scrollbar-thin">
        {/* Fullscreen */}
        <button
          type="button"
          onClick={handleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-2 text-xs font-medium text-slate-200 border border-slate-700 transition-all shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          <span className="hidden sm:inline">Tela cheia</span>
        </button>

        {/* Mute */}
        <button
          type="button"
          onClick={handleMute}
          className={`inline-flex items-center gap-1.5 rounded-lg active:scale-95 px-3 py-2 text-xs font-medium border transition-all shrink-0 ${
            muted
              ? "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25"
              : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
          <span className="hidden sm:inline">{muted ? "Mudo" : "Som"}</span>
        </button>

        {/* Controls */}
        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className={`inline-flex items-center gap-1.5 rounded-lg active:scale-95 px-3 py-2 text-xs font-medium border transition-all shrink-0 ${
            showControls
              ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25"
              : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 12h4M8 10v4" />
            <circle cx="17" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="13" r="1" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">Controles</span>
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-700 shrink-0" />

        {/* Extra toolbar items (rating, favorite, share, etc.) */}
        {toolbarExtra}
      </div>
    </>
  );
}
