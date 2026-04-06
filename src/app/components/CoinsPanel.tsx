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

function formatReason(reason: string) {
  return REASON_LABELS[reason] ?? reason;
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
          <div
            key={i}
            className="h-20 rounded-2xl bg-slate-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Coin balance */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
              Saldo de moedas
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-200">
              🪙 {data.coins}
            </p>
          </div>
          {data.isPremium && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100">
              ★ Premium
            </span>
          )}
        </div>
      </div>

      {/* Themes */}
      <div>
        <h3 className="text-sm font-semibold text-slate-50 mb-3">
          Temas do perfil
        </h3>
        {error && (
          <p className="mb-3 text-xs text-red-400">{error}</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {data.themes.map((theme) => {
            const isActive = data.currentTheme === theme.id;
            const canUnlock =
              theme.cost === 0 ||
              (data.coins >= theme.cost &&
                (!theme.premiumOnly || data.isPremium));
            const isLocked = theme.premiumOnly && !data.isPremium;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => !isActive && canUnlock && unlockTheme(theme.id)}
                disabled={isActive || !canUnlock || unlocking === theme.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : canUnlock
                      ? "border-slate-800 bg-slate-900/55 hover:border-cyan-400/30"
                      : "border-slate-800/50 bg-slate-900/30 opacity-60"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${theme.gradient} ${isActive ? "ring-2 ring-cyan-400/50" : ""}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {theme.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] text-cyan-300">
                        Ativo
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isLocked
                      ? "🔒 Premium"
                      : theme.cost === 0
                        ? "Gratuito"
                        : `🪙 ${theme.cost}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coin history */}
      <div>
        <h3 className="text-sm font-semibold text-slate-50 mb-3">
          Histórico de moedas
        </h3>
        {data.history.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            Jogue, complete missões e volte diariamente para acumular moedas.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
            {data.history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-slate-200">
                    {formatReason(tx.reason)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
