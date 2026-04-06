"use client";

import type { FormEvent } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getAnalyticsSessionId } from "@/lib/analytics";

type Mode = "login" | "register";

const DEMO_LOGIN = {
  email: "demo@gaming-portal.local",
  password: "Demo123456!",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedMode: Mode =
    searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(resolvedMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("from") || "/account";

  useEffect(() => {
    setMode(resolvedMode);
  }, [resolvedMode]);

  function updateMode(nextMode: Mode) {
    setMode(nextMode);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);

    const queryString = params.toString();
    router.replace(queryString ? `/login?${queryString}` : "/login", {
      scroll: false,
    });
  }

  function fillDemoCredentials() {
    updateMode("login");
    setEmail(DEMO_LOGIN.email);
    setPassword(DEMO_LOGIN.password);
    setDisplayName("Jogador Demo");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/user/login" : "/api/auth/user/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "login"
              ? {
                  email,
                  password,
                  sessionId: getAnalyticsSessionId(),
                  referrer: document.referrer || undefined,
                }
              : {
                  displayName,
                  email,
                  password,
                  sessionId: getAnalyticsSessionId(),
                  referrer: document.referrer || undefined,
                },
          ),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Não foi possível concluir a autenticação.");
        setLoading(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Falha inesperada. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px-48px)] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(234,179,8,0.12),transparent_30%),linear-gradient(180deg,#020617,#0f172a,#020617)] px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/75 p-6 shadow-[0_0_80px_rgba(2,6,23,0.9)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
            Player Hub
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
            Entre para salvar favoritos e continuar de onde parou.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300">
            Sua conta libera favoritos, histórico recente de partidas e uma área
            pessoal para acompanhar os jogos que mais performam para você.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
              <p className="text-xs font-medium text-slate-100">Favoritos</p>
              <p className="mt-2 text-[12px] text-slate-400">
                Monte sua própria coleção de jogos em um clique.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
              <p className="text-xs font-medium text-slate-100">Histórico</p>
              <p className="mt-2 text-[12px] text-slate-400">
                Retorne rápido aos títulos jogados recentemente.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
              <p className="text-xs font-medium text-slate-100">Conta leve</p>
              <p className="mt-2 text-[12px] text-slate-400">
                Sem fricção: cadastro simples e acesso imediato ao portal.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/80 p-6 shadow-[0_0_70px_rgba(15,23,42,0.75)] backdrop-blur">
          <div className="flex rounded-full border border-slate-800 bg-slate-900/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => updateMode("login")}
              className={`flex-1 rounded-full px-3 py-2 transition-colors ${
                mode === "login"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => updateMode("register")}
              className={`flex-1 rounded-full px-3 py-2 transition-colors ${
                mode === "register"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              Criar conta
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
                  Acesso demo local
                </p>
                <p className="mt-1 text-sm font-medium text-slate-50">
                  Use a conta pronta para revisar a experiencia logada.
                </p>
                <p className="mt-2 text-[12px] text-slate-300">
                  Email: {DEMO_LOGIN.email}
                </p>
                <p className="text-[12px] text-slate-300">
                  Senha: {DEMO_LOGIN.password}
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex shrink-0 items-center rounded-full border border-emerald-300/35 bg-slate-950/40 px-3 py-1.5 text-[11px] font-medium text-emerald-100 transition-colors hover:border-emerald-200/60 hover:text-white"
              >
                Preencher demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                  placeholder="Ex.: Alex"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Senha
              </label>
              <input
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? "Processando..."
                : mode === "login"
                ? "Entrar na conta"
                : "Criar conta e entrar"}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-500">
            Acesso administrativo continua separado em <Link href="/admin/login" className="text-cyan-300 hover:text-cyan-200">/admin/login</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}