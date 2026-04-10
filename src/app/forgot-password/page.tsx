"use client";

import type { FormEvent } from "react";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Erro ao processar solicitação.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(15,23,42,0.9)] scale-95 md:scale-100 transition-transform">
          <div className="mb-5 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-fuchsia-500 shadow-[0_0_25px_rgba(34,211,238,0.6)]">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
              Redefinir senha
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Informe seu email e enviaremos um link de redefinição.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <span className="text-xl">✉️</span>
              </div>
              <p className="text-sm font-medium text-emerald-200">
                Se uma conta existir com esse email, enviaremos um link de
                redefinição.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Verifique sua caixa de entrada e spam.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-xs font-medium text-cyan-300 hover:text-cyan-200"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50"
                  placeholder="voce@email.com"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition-all active:scale-[0.98]"
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>

              <p className="text-center text-[10px] text-slate-500">
                Lembrou a senha?{" "}
                <Link
                  href="/login"
                  className="text-cyan-300 hover:text-cyan-200 font-medium"
                >
                  Faça login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
