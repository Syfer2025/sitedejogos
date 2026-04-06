"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";

import { getAnalyticsSessionId } from "@/lib/analytics";
import { sendPublicAnalyticsEvent } from "@/lib/analytics-client";

type TrackableLinkEvent = {
  type: "home_click" | "blog_click";
  path: string;
  destinationPath?: string;
};

type TrackedLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
  trackingPath?: string;
  trackingEventType?: TrackableLinkEvent["type"];
  trackingDestinationPath?: string;
  additionalTrackingEvents?: TrackableLinkEvent[];
  children: ReactNode;
};

export function TrackedLink({
  href,
  trackingPath,
  trackingEventType = "home_click",
  trackingDestinationPath,
  additionalTrackingEvents,
  children,
  onClick,
  ...props
}: TrackedLinkProps) {
  function dispatchTrackedEvent(event: TrackableLinkEvent) {
    sendPublicAnalyticsEvent({
      type: event.type,
      path: event.path,
      destinationPath: event.destinationPath ?? href,
      sessionId: getAnalyticsSessionId(),
      referrer: window.location.pathname,
    });
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || typeof window === "undefined") {
      return;
    }

    if (trackingPath) {
      dispatchTrackedEvent({
        type: trackingEventType,
        path: trackingPath,
        destinationPath: trackingDestinationPath,
      });
    }

    additionalTrackingEvents?.forEach((trackedEvent) => {
      dispatchTrackedEvent(trackedEvent);
    });
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}