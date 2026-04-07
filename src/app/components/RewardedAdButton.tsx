"use client";

import { useCallback, useEffect, useState } from "react";

type RewardStatus = {
  allowed: boolean;
  viewsToday: number;
  maxViews: number;
  cooldownRemaining: number;
};

type RewardedAdButtonProps = {
  isAuthenticated: boolean;
};

export function RewardedAdButton({ isAuthenticated }: RewardedAdButtonProps) {
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [phase, setPhase] = useState<"idle" | "watching" | "rewarded" | "error">("idle");
  const [countdown, setCountdown] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/user/rewarded-ad");
      if (res.ok) setStatus(await res.json());
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Countdown timer for "watching" phase
  useEffect(() => {
    if (phase !== "watching" || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // When countdown reaches 0, claim reward
  useEffect(() => {
    if (phase !== "watching" || countdown > 0) return;

    async function claim() {
      try {
        const res = await fetch("/api/user/rewarded-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewardType: "coins" }),
        });
        if (res.ok) {
          const data = await res.json();
          setEarnedCoins(data.coins ?? 50);
          setPhase("rewarded");
          fetchStatus();
          setTimeout(() => setPhase("idle"), 3000);
        } else {
          setPhase("error");
          setTimeout(() => setPhase("idle"), 2000);
        }
      } catch {
        setPhase("error");
        setTimeout(() => setPhase("idle"), 2000);
      }
    }

    claim();
  }, [phase, countdown, fetchStatus]);

  function handleWatch() {
    if (!isAuthenticated || !status?.allowed) return;
    setPhase("watching");
    setCountdown(5);
  }

  if (!isAuthenticated) return null;

  const remaining = status ? status.maxViews - status.viewsToday : 0;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
      {phase === "rewarded" ? (
        <div className="flex flex-col items-center gap-2 py-2 animate-fade-in">
          <span className="text-2xl">🪙</span>
          <p className="text-sm font-bold text-amber-300">+{earnedCoins} moedas!</p>
          <p className="text-[10px] text-slate-400">Recompensa adicionada ao seu saldo</p>
        </div>
      ) : phase === "watching" ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">Assistindo anuncio...</p>
          <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{countdown}s</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100">Ganhe moedas gratis</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Assista um anuncio e ganhe 50 moedas. {remaining > 0 ? `${remaining}x restantes hoje.` : "Limite diario atingido."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleWatch}
            disabled={!status?.allowed || phase !== "idle"}
            className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assistir
          </button>
        </div>
      )}
    </div>
  );
}
