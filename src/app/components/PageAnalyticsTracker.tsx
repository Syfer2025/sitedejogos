"use client";

import { useEffect } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { getAnalyticsSessionId } from "@/lib/analytics";
import { sendPublicAnalyticsEvent } from "@/lib/analytics-client";

export function PageAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const path = search ? `${pathname}?${search}` : pathname;
    const storageKey = `arcade:page-view:${path}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    sendPublicAnalyticsEvent({
        type: "page_view",
        path,
        sessionId: getAnalyticsSessionId(),
        referrer: document.referrer || undefined,
    });
  }, [pathname, search]);

  return null;
}