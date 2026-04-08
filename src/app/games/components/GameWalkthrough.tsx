"use client";

import { useEffect } from "react";
import Script from "next/script";

type GameWalkthroughProps = {
  gameId: string;
  color?: string;
  height?: string;
  showAds: boolean;
};

declare global {
  interface Window {
    VIDEO_OPTIONS?: {
      gameid: string;
      width: string;
      height: string;
      color: string;
      getAds: "true" | "false";
    };
  }
}

export function GameWalkthrough({
  gameId,
  color = "#3f007e",
  height = "480px",
  showAds,
}: GameWalkthroughProps) {
  useEffect(() => {
    window.VIDEO_OPTIONS = {
      gameid: gameId,
      width: "100%",
      height,
      color,
      getAds: showAds ? "true" : "false",
    };
  }, [gameId, color, height, showAds]);

  return (
    <>
      <div id="gamemonetize-video" className="mt-6" />
      <Script
        id="gamemonetize-video-api"
        src="https://api.gamemonetize.com/video.js"
        strategy="afterInteractive"
      />
    </>
  );
}
