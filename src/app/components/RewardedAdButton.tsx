"use client";

import { useState, useEffect } from "react";
import { claimRewardedAdReward } from "@/app/actions/monetization";

type RewardedAdButtonProps = {
  isPremium: boolean;
};

export function RewardedAdButton({ isPremium }: RewardedAdButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "watching" | "claiming" | "cooldown">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  // Um cooldown de 3 minutos para evitar spam massivo
  useEffect(() => {
    if (status === "cooldown") {
      const tick = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus("idle");
            setMessage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(tick);
    }
  }, [status]);

  if (isPremium) {
    return null; // Premium users don't need to watch ads for small coin injections
  }

  const handleWatchAd = async () => {
    if (status !== "idle") return;

    setStatus("loading");
    setMessage(null);
    
    // Simulação do AdSense Rewarded / H5 Ads (Como o AdSense standard de display/vignette já roda global, o rewarded geralmente é em iframe ou tag especifica)
    // Para simplificar a experiência sem depender de aprovação manual do Google AdManager, simularemos o timeout de um vídeo de 15s.
    setTimeout(() => {
      setStatus("watching");
      let count = 10;
      const interval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(interval);
          finishAdAndClaim();
        }
      }, 1000);
    }, 800);
  };

  const finishAdAndClaim = async () => {
    setStatus("claiming");
    try {
      const result = await claimRewardedAdReward();
      
      if (result.success) {
        setMessage({ text: `Vídeo concluído! Você recebeu +${result.coinsGranted} moedas.`, type: "success" });
      } else {
        setMessage({ text: result.error ?? "Erro ao resgatar.", type: "error" });
      }
    } catch {
      setMessage({ text: "Ocorreu um problema de conexão.", type: "error" });
    } finally {
      setStatus("cooldown");
      setTimeLeft(180); // 3 minutos cooldown
    }
  };

  if (status === "watching") {
    return (
      <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-500/50 bg-cyan-950/40 py-3 px-4 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span className="text-xs font-semibold text-cyan-200">Assistindo anúncio para recompensa...</span>
      </div>
    );
  }

  if (status === "claiming") {
    return (
      <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-500/50 bg-amber-950/40 py-3 px-4">
        <span className="text-xl animate-bounce">🪙</span>
        <span className="text-xs font-semibold text-amber-200">Enviando moedas ao cofre...</span>
      </div>
    );
  }

  if (status === "cooldown") {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 py-3 px-4 text-center">
        {message && (
          <p className={`text-[10px] font-bold ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </p>
        )}
        <div className="flex items-center gap-2 opacity-70 mt-1">
          <span className="text-lg">🕒</span>
          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            Novo anúncio em {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleWatchAd}
      disabled={status !== "idle"}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 py-3 px-4 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-400/60 hover:shadow-purple-500/25 active:scale-[0.98]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/5 to-fuchsia-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative z-10 text-2xl group-hover:animate-pulse">📺</span>
      <div className="relative z-10 flex flex-col items-start leading-tight">
        <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-100">
          Apoiar & Ganhar
        </span>
        <span className="text-[10px] text-fuchsia-300/80">
          Assista um vídeo e ganhe +50 Moedas
        </span>
      </div>
    </button>
  );
}
