"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════
   Advanced Anti-AdBlock Detection System
   Multi-layer detection + progressive response levels
   ═══════════════════════════════════════════════════════ */

type AdBlockLevel = "none" | "soft" | "moderate" | "hard";

type AdBlockContextValue = {
  detected: boolean;
  level: AdBlockLevel;
  visitCount: number;
  /** Number of games played today (for hard-level daily limit) */
  gamesPlayedToday: number;
  /** Whether user can play (considering daily limit) */
  canPlay: boolean;
  /** Register that a game was played */
  registerGamePlay: () => void;
  /** Mark that the user dismissed the banner/modal for this session */
  dismiss: () => void;
  dismissed: boolean;
};

const AdBlockContext = createContext<AdBlockContextValue>({
  detected: false,
  level: "none",
  visitCount: 0,
  gamesPlayedToday: 0,
  canPlay: true,
  registerGamePlay: () => {},
  dismiss: () => {},
  dismissed: false,
});

export function useAdBlock(): AdBlockContextValue {
  return useContext(AdBlockContext);
}

/** Backward-compatible hook */
export function useAdBlockDetected(): boolean {
  return useContext(AdBlockContext).detected;
}

export function useAdBlockState(): "unknown" | "active" | "inactive" {
  const { detected } = useContext(AdBlockContext);
  return detected ? "active" : "inactive";
}

/* ── Storage Keys ── */
const VISIT_COUNT_KEY = "aab_vc";
const LAST_VISIT_KEY = "aab_lv";
const GAMES_TODAY_KEY = "aab_gt";
const GAMES_DATE_KEY = "aab_gd";
const DAILY_GAME_LIMIT = 3;

/* ── Detection Methods ── */

/**
 * Method 1: Bait Element (existing, improved)
 * Creates a DOM element mimicking an ad and checks if it's hidden.
 */
function detectViaBait(): Promise<boolean> {
  return new Promise((resolve) => {
    const bait = document.createElement("div");
    bait.className = "adsbox ad-placement ad-banner textads banner-ads ad-wrapper pub_300x250 pub_300x250m pub_728x90";
    bait.setAttribute("data-ad-slot", "test");
    bait.setAttribute("id", "ad-test-container");
    bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;";
    bait.innerHTML = "&nbsp;";
    document.body.appendChild(bait);

    requestAnimationFrame(() => {
      setTimeout(() => {
        const blocked =
          bait.offsetHeight === 0 ||
          bait.offsetParent === null ||
          getComputedStyle(bait).display === "none" ||
          getComputedStyle(bait).visibility === "hidden";
        bait.remove();
        resolve(blocked);
      }, 120);
    });
  });
}

/**
 * Method 2: Fetch Bait
 * Tries to fetch a URL that ad blockers commonly block.
 * Uses common ad-related paths that appear in filter lists.
 */
function detectViaFetch(): Promise<boolean> {
  return new Promise((resolve) => {
    const baitUrls = [
      "/ads/prebid.js",
      "/pagead/js/adsbygoogle.js",
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
    ];

    // Try the first local URL
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, 2000);

    fetch(baitUrls[0], {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    })
      .then(() => {
        clearTimeout(timeout);
        resolve(false); // Request succeeded = not blocked
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(true); // Request failed/blocked
      });
  });
}

/**
 * Method 3: Google Ads Script Check
 * Checks if the Google AdSense script was loaded and not blocked.
 */
function detectViaGoogleAds(): boolean {
  // Check if adsbygoogle exists and is functional
  if (typeof window === "undefined") return false;

  const scripts = document.querySelectorAll('script[src*="adsbygoogle"]');
  if (scripts.length > 0) {
    // Script tag exists but check if it was actually loaded
    const hasAdsByGoogle = !!(window as Record<string, unknown>).adsbygoogle;
    return !hasAdsByGoogle; // If push array doesn't exist, it was blocked
  }

  // No script tag = AdSense not configured, can't determine
  return false;
}

/**
 * Method 4: InsAdSense DOM Check
 * Creates an `ins.adsbygoogle` element and checks if it gets hidden.
 */
function detectViaInsElement(): Promise<boolean> {
  return new Promise((resolve) => {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.cssText = "display:block;position:absolute;top:-9999px;left:-9999px;width:300px;height:250px;";
    ins.setAttribute("data-ad-client", "ca-pub-0000000000000000");
    ins.setAttribute("data-ad-slot", "0000000000");
    document.body.appendChild(ins);

    setTimeout(() => {
      const blocked =
        ins.offsetHeight === 0 ||
        getComputedStyle(ins).display === "none" ||
        getComputedStyle(ins).visibility === "hidden" ||
        ins.clientHeight === 0;
      ins.remove();
      resolve(blocked);
    }, 200);
  });
}

/**
 * Run all detection methods and determine if adblock is active.
 * Requires 2+ methods to agree for a positive detection.
 */
async function runDetection(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const results = await Promise.allSettled([
    detectViaBait(),
    detectViaFetch(),
    Promise.resolve(detectViaGoogleAds()),
    detectViaInsElement(),
  ]);

  let positives = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      positives++;
    }
  }

  // 2+ methods confirm = adblock detected
  return positives >= 2;
}

/* ── Visit Counter + Level Logic ── */

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getVisitCount(): number {
  try {
    return parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementVisitCount(): number {
  try {
    const today = getToday();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

    // Only count once per day
    if (lastVisit === today) {
      return getVisitCount();
    }

    const count = getVisitCount() + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    localStorage.setItem(LAST_VISIT_KEY, today);
    return count;
  } catch {
    return 0;
  }
}

function getGamesPlayedToday(): number {
  try {
    const date = localStorage.getItem(GAMES_DATE_KEY);
    if (date !== getToday()) {
      // Reset for new day
      localStorage.setItem(GAMES_DATE_KEY, getToday());
      localStorage.setItem(GAMES_TODAY_KEY, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(GAMES_TODAY_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function addGamePlayed(): number {
  try {
    const date = localStorage.getItem(GAMES_DATE_KEY);
    let count = 0;
    if (date === getToday()) {
      count = parseInt(localStorage.getItem(GAMES_TODAY_KEY) || "0", 10);
    } else {
      localStorage.setItem(GAMES_DATE_KEY, getToday());
    }
    count++;
    localStorage.setItem(GAMES_TODAY_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

function computeLevel(visitCount: number): AdBlockLevel {
  if (visitCount <= 3) return "soft";
  if (visitCount <= 7) return "moderate";
  return "hard";
}

/* ── Provider ── */

export function AdBlockProvider({ children }: { children: ReactNode }) {
  const [detected, setDetected] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [gamesPlayedToday, setGamesPlayedToday] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    runDetection().then((blocked) => {
      setDetected(blocked);
      if (blocked) {
        const count = incrementVisitCount();
        setVisitCount(count);
        setGamesPlayedToday(getGamesPlayedToday());
      }
    });
  }, []);

  const level: AdBlockLevel = detected ? computeLevel(visitCount) : "none";
  const canPlay = level !== "hard" || gamesPlayedToday < DAILY_GAME_LIMIT;

  const registerGamePlay = useCallback(() => {
    const count = addGamePlayed();
    setGamesPlayedToday(count);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return (
    <AdBlockContext.Provider
      value={{
        detected,
        level,
        visitCount,
        gamesPlayedToday,
        canPlay,
        registerGamePlay,
        dismiss,
        dismissed,
      }}
    >
      {children}
    </AdBlockContext.Provider>
  );
}
