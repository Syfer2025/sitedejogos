"use client";

import { useEffect } from "react";

import { getAnalyticsSessionId } from "@/lib/analytics";
import { sendPublicAnalyticsEvent } from "@/lib/analytics-client";

export function BlogImpressionTracker({
  sourcePath,
  destinationPath,
}: {
  sourcePath: string;
  destinationPath: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = `arcade:blog-impression:${sourcePath}:${destinationPath}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    sendPublicAnalyticsEvent({
      type: "blog_impression",
      path: sourcePath,
      destinationPath,
      sessionId: getAnalyticsSessionId(),
      referrer: window.location.pathname,
    });
  }, [destinationPath, sourcePath]);

  return null;
}

export function BlogViewTracker({ path }: { path: string }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = `arcade:blog-view:${path}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const referrer = ref === "notification" ? "notification" : (document.referrer || undefined);

    sendPublicAnalyticsEvent({
      type: "blog_view",
      path,
      sessionId: getAnalyticsSessionId(),
      referrer,
    });
  }, [path]);

  return null;
}