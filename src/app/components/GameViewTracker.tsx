"use client";

import { useEffect } from "react";

import { getAnalyticsSessionId } from "@/lib/analytics";

type GameViewTrackerProps = {
  slug: string;
};

export function GameViewTracker({ slug }: GameViewTrackerProps) {
  useEffect(() => {
    const storageKey = `arcade:view:${slug}`;

    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    void fetch(`/api/public/games/${slug}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: getAnalyticsSessionId(),
        referrer: document.referrer || undefined,
      }),
    });
  }, [slug]);

  return null;
}