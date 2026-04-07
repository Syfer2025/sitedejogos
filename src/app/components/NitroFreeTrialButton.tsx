"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NitroFreeTrialButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  async function handleActivate() {
    setPending(true);
    setResult(null);

    try {
      const res = await fetch("/api/user/nitro/free-trial", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true });
        setTimeout(() => router.refresh(), 1500);
      } else {
        setResult({ error: data.error ?? "Erro ao ativar trial." });
      }
    } catch {
      setResult({ error: "Erro de conexao." });
    } finally {
      setPending(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-300">
        Premium ativado por 3 dias! Aproveite.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleActivate}
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-8 py-3 text-sm font-bold text-white transition-all hover:from-purple-400 hover:to-cyan-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Ativando..." : "Ativar teste gratis"}
      </button>
      {result?.error && (
        <p className="mt-2 text-xs text-red-400">{result.error}</p>
      )}
    </div>
  );
}
