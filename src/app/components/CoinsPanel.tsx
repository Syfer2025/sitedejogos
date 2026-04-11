"use client";

import { useCallback, useEffect, useState } from "react";

import { RewardedAdButton } from "./RewardedAdButton";

type CoinTx = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type MonetizationData = {
  coins: number;
  isPremium: boolean;
  history: CoinTx[];
};

const REASON_LABELS: Record<string, string> = {
  daily_login: "Login diário",
  streak_3: "Streak 3 dias",
  streak_7: "Streak 7 dias",
  streak_14: "Streak 14 dias",
  streak_30: "Streak 30 dias",
  mission_complete: "Missão concluída",
  achievement_unlock: "Conquista desbloqueada",
  blog_read: "Leitura de blog",
  level_up: "Subiu de nível",
  theme_unlock: "Desbloqueio de tema",
  purchase: "Compra",
};

const REASON_ICONS: Record<string, string> = {
  daily_login: "📅",
  streak_3: "🔥",
  streak_7: "🔥",
  streak_14: "🔥",
  streak_30: "🔥",
  mission_complete: "🎯",
  achievement_unlock: "🏆",
  blog_read: "📖",
  level_up: "⬆️",
  theme_unlock: "🎨",
  purchase: "🛒",
};

function formatReason(reason: string) {
  return REASON_LABELS[reason] ?? reason;
}

function getReasonIcon(reason: string) {
  return REASON_ICONS[reason] ?? "💰";
}

export function CoinsPanel() {
  const [data, setData] = useState<MonetizationData | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user/monetization");
    if (res.ok) {
      const json = await res.json();
      setData({ coins: json.profile?.coins ?? json.coins ?? 0, isPremium: json.profile?.isPremium ?? json.isPremium ?? false, history: json.history ?? [] });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);


  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/8 via-amber-900/5 to-transparent p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/6 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/15 to-amber-500/10 border border-amber-400/20 shadow-[0_8px_24px_rgba(245,158,11,0.1)]">
              <span className="text-3xl">🪙</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">Saldo de moedas</p>
              <p className="mt-1 text-4xl font-black tabular-nums text-amber-200 tracking-tight">{data.coins}</p>
            </div>
          </div>
          {data.isPremium && (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-400/25 bg-amber-500/8 px-4 py-2.5">
              <span className="text-lg text-amber-400">★</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200">Premium</span>
            </div>
          )}
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-700/50 bg-slate-900/40 px-2.5 py-1 text-[10px] text-slate-400">⬆️ Subir de Nível = +20</span>
          <span className="rounded-full border border-amber-700/50 bg-amber-900/20 px-2.5 py-1 text-[10px] text-amber-500">Loja Premium em breve</span>
        </div>
      </div>

      {/* Rewarded Ads */}
      <RewardedAdButton isPremium={data.isPremium} />

      {/* Extrato de moedas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-50">Extrato</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Movimentação de moedas</p>
          </div>
        </div>
        {data.history.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center">
            <span className="text-2xl">📊</span>
            <p className="mt-2 text-sm text-slate-400">Jogue e complete missões para acumular moedas.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {data.history.map((tx) => (
              <div key={tx.id} className="group/tx flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/45 px-3 py-2.5 transition-all hover:border-slate-700/80 hover:bg-slate-900/65">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-sm">{getReasonIcon(tx.reason)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{formatReason(tx.reason)}</p>
                  <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
