"use client";

import { useEffect } from "react";

type PlayerHistoryTrackerProps = {
  gameId: string;
};

export function PlayerHistoryTracker({ gameId }: PlayerHistoryTrackerProps) {
  useEffect(() => {
    const storageKey = `arcade:history:${gameId}`;

    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    void fetch("/api/user/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId }),
    });
  }, [gameId]);

  return null;
}