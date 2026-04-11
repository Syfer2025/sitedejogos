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

type MonetizationData = {
  coins: number;
  isPremium: boolean;
  currentTheme: string;
  themes: Theme[];
};

export function ThemesPanel() {
  const [data, setData] = useState<MonetizationData | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user/monetization");
    if (res.ok) {
      const json = await res.json();
      setData({ coins: json.profile?.coins ?? json.coins ?? 0, isPremium: json.profile?.isPremium ?? json.isPremium ?? false, currentTheme: json.profile?.profileTheme ?? json.currentTheme ?? "default", themes: json.themes ?? [] });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

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
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <span className="text-2xl">🪙</span>
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest">Seu saldo</p>
          <p className="text-xl font-black text-amber-200">{data.coins} moedas</p>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2 text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-50">Temas do perfil</h3>
        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] text-slate-400">
          {data.themes.filter((t) => t.cost === 0 || data.coins >= t.cost).length}/{data.themes.length}
        </span>
      </div>

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
  );
}
