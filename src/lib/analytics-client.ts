"use client";

import type { PublicAnalyticsEvent } from "@/lib/analytics";

export function sendPublicAnalyticsEvent(event: PublicAnalyticsEvent) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify(event);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    const queued = navigator.sendBeacon("/api/analytics", blob);

    if (queued) {
      return;
    }
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
}