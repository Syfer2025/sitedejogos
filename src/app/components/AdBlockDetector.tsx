"use client";

import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";

type AdBlockState = "unknown" | "active" | "inactive";

const AdBlockContext = createContext<AdBlockState>("unknown");

export function useAdBlockDetected(): boolean {
  return useContext(AdBlockContext) === "active";
}

export function useAdBlockState(): AdBlockState {
  return useContext(AdBlockContext);
}

/**
 * Detects ad blockers using a bait technique:
 * Creates an element that mimics an ad (class names + size),
 * then checks if it was hidden by ad blocking software.
 */
function detectAdBlock(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const bait = document.createElement("div");

    // Use class names and attributes commonly targeted by ad blockers
    bait.className =
      "adsbox ad-placement ad-banner textads banner-ads ad-wrapper";
    bait.setAttribute("data-ad-slot", "test");
    bait.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;";
    bait.innerHTML = "&nbsp;";

    document.body.appendChild(bait);

    // Give the ad blocker a moment to process
    requestAnimationFrame(() => {
      setTimeout(() => {
        const blocked =
          bait.offsetHeight === 0 ||
          bait.offsetParent === null ||
          getComputedStyle(bait).display === "none" ||
          getComputedStyle(bait).visibility === "hidden";

        bait.remove();
        resolve(blocked);
      }, 100);
    });
  });
}

export function AdBlockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdBlockState>("unknown");

  useEffect(() => {
    detectAdBlock().then((blocked) => {
      setState(blocked ? "active" : "inactive");
    });
  }, []);

  return (
    <AdBlockContext.Provider value={state}>{children}</AdBlockContext.Provider>
  );
}
