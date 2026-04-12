"use client";

import { useState } from "react";
import { useTranslate } from "./LocaleContext";

export function NewsletterForm() {
  const t = useTranslate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(t("newsletter.success", {}, "Pronto! Enviaremos os melhores jogos toda semana."));
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? t("newsletter.error", {}, "Algo deu errado. Tente novamente."));
      }
    } catch {
      setStatus("error");
      setMessage(t("newsletter.connectionError", {}, "Erro de conexão. Tente novamente."));
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-200">
        {t("newsletter.title", {}, "Newsletter Semanal de Jogos")}
      </p>
      <p className="text-xs text-slate-400">
        {t("newsletter.description", {}, "Receba os melhores novos jogos toda semana. Sem spam.")}
      </p>
      <div className="flex gap-2 mt-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletter.placeholder", {}, "seu@email.com")}
          required
          className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/30 disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? t("newsletter.subscribing", {}, "...") : t("newsletter.subscribe", {}, "Inscrever-se")}
        </button>
      </div>
      {status === "error" && (
        <p className="text-[11px] text-red-400">{message}</p>
      )}
    </form>
  );
}
