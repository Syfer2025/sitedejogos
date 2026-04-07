"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = {
  id: string;
  label: string;
  gradient: string;
  borderColor: string;
  cost: number;
  premiumOnly: boolean;
};

type CoinTx = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type MonetizationData = {
  coins: number;
  isPremium: boolean;
  currentTheme: string;
  themes: Theme[];
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
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user/monetization");
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlockTheme = async (themeId: string) => {
    setUnlocking(themeId);
    setError("");
    try {
      const res = await fetch("/api/user/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock_theme", themeId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao desbloquear tema.");
      } else {
        await refresh();
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setUnlocking(null);
    }
  };

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

      {/* Themes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-50">Temas do perfil</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Personalize o visual da sua conta</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] text-slate-400">
            {data.themes.filter(t => t.cost === 0 || data.coins >= t.cost).length}/{data.themes.length}
          </span>
        </div>
        {error && <p className="mb-3 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2 text-xs text-red-400">{error}</p>}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.themes.map((theme) => {
            const isActive = data.currentTheme === theme.id;
            const canUnlock = theme.cost === 0 || (data.coins >= theme.cost && (!theme.premiumOnly || data.isPremium));
            const isLocked = theme.premiumOnly && !data.isPremium;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => !isActive && canUnlock && unlockTheme(theme.id)}
                disabled={isActive || !canUnlock || unlocking === theme.id}
                className={`group/theme relative flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-300 ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-500/8 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                    : canUnlock
                      ? "border-slate-800 bg-slate-900/55 hover:border-cyan-400/30 hover:-translate-y-0.5"
                      : "border-slate-800/40 bg-slate-900/25 opacity-50"
                }`}
              >
                <div className="relative">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${theme.gradient} transition-all duration-300 ${isActive ? "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-950" : "group-hover/theme:scale-110"}`} />
                  {isActive && (
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] text-slate-950">✓</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{theme.label}</p>
                    {isActive && <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 text-[9px] font-bold text-cyan-300 uppercase">Ativo</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {isLocked ? "🔒 Exclusivo Premium" : theme.cost === 0 ? "✨ Gratuito" : `🪙 ${theme.cost} moedas`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
