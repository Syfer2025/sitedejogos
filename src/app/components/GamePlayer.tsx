"use client";

import { useRef, useState } from "react";

type FullscreenContainer = HTMLDivElement & {
  webkitRequestFullscreen?: () => void;
};

type GamePlayerProps = {
  iframeUrl: string;
  title: string;
};

export function GamePlayer({ iframeUrl, title }: GamePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleFullscreen = () => {
    const container = containerRef.current as FullscreenContainer | null;
    if (!container) return;

    if (container.requestFullscreen) {
      void container.requestFullscreen();
      return;
    }

    container.webkitRequestFullscreen?.();
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={handleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/80 hover:bg-purple-500 active:scale-95 px-4 py-2 text-xs font-medium text-white shadow-[0_0_22px_rgba(147,51,234,0.7)] transition-all min-h-[40px]"
        >
          ⛶ Tela cheia
        </button>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Pressione Esc para sair
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-[0_0_35px_rgba(15,23,42,0.9)]"
      >
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-400 animate-pulse" />
              <p className="text-xs text-slate-400 animate-pulse">Carregando jogo...</p>
            </div>
          </div>
        )}

        <div className="aspect-video w-full bg-[radial-gradient(circle_at_10%_20%,rgba(96,165,250,0.22),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(147,51,234,0.36),transparent_55%),linear-gradient(135deg,#020617,#020617)]">
          <iframe
            src={iframeUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            loading="eager"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </>
  );
}