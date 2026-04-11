"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AchievementToastItem = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  xpReward: number;
  coinReward: number;
};

const TOAST_DURATION_MS = 5000;
const POLL_INTERVAL_MS = 20000;

const SEEN_KEY = "arcade:achievements:toast:seen";

function getSeenKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function markSeen(keys: string[]) {
  try {
    const existing = getSeenKeys();
    keys.forEach((k) => existing.add(k));
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(existing)));
  } catch {
    // ignore
  }
}

export function AchievementUnlockToast({ userId }: { userId?: string }) {
  const [queue, setQueue] = useState<AchievementToastItem[]>([]);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAndCheck = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/user/gamification-overview");
      if (!res.ok) return;
      const data = await res.json();
      const unlockedKeys: string[] = data.unlockedAchievementKeys ?? [];
      const definitions: AchievementToastItem[] = data.achievementDefinitions ?? [];

      const seen = getSeenKeys();
      const newOnes = definitions.filter(
        (d) => unlockedKeys.includes(d.key) && !seen.has(d.key),
      );

      if (newOnes.length > 0) {
        markSeen(newOnes.map((d) => d.key));
        setQueue((prev) => [...prev, ...newOnes]);
      }
    } catch {
      // silent
    }
  }, [userId]);

  // Initial check + polling
  useEffect(() => {
    if (!userId) return;
    void fetchAndCheck();
    const interval = setInterval(fetchAndCheck, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, fetchAndCheck]);

  // Show next toast in queue
  useEffect(() => {
    if (queue.length === 0 || visible) return;
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setQueue((prev) => prev.slice(1));
    }, TOAST_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queue, visible]);

  const current = queue[0];
  if (!current || !visible) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[300] w-72 animate-slide-in-right"
      style={{
        animation: "slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-950 shadow-2xl shadow-amber-500/20 backdrop-blur-md">
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-amber-400/60 rounded-full"
          style={{ animation: `shrinkBar ${TOAST_DURATION_MS}ms linear forwards` }}
        />

        <div className="flex items-start gap-4 p-4">
          {/* Achievement image/icon */}
          <div className="relative shrink-0">
            {current.imageUrl ? (
              <div
                className="h-14 w-14 rounded-2xl border border-amber-400/30 bg-cover bg-center shadow-lg"
                style={{ backgroundImage: `url("${current.imageUrl}")` }}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-2xl shadow-lg">
                {current.icon}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 shadow">
              ✓
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
              🏆 Conquista Desbloqueada!
            </p>
            <p className="mt-0.5 text-sm font-black text-white leading-tight">{current.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-2">{current.description}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              {current.xpReward > 0 && (
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-cyan-300 font-semibold">
                  +{current.xpReward} XP
                </span>
              )}
              {current.coinReward > 0 && (
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-300 font-semibold">
                  +{current.coinReward} 🪙
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              setQueue((prev) => prev.slice(1));
            }}
            className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
