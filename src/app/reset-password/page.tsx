"use client";

import type { FormEvent } from "react";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function calcPasswordStrength(pw: string): {
  level: StrengthLevel;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: "Mínimo 8 caracteres", passed: pw.length >= 8 },
    { label: "Letra maiúscula", passed: /[A-Z]/.test(pw) },
    { label: "Letra minúscula", passed: /[a-z]/.test(pw) },
    { label: "Número", passed: /\d/.test(pw) },
    { label: "Caractere especial (!@#$...)", passed: /[^A-Za-z0-9]/.test(pw) },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const map: Record<number, { level: StrengthLevel; label: string; color: string }> = {
    0: { level: 0, label: "", color: "transparent" },
    1: { level: 1, label: "Muito fraca", color: "#ef4444" },
    2: { level: 2, label: "Fraca", color: "#f97316" },
    3: { level: 3, label: "Boa", color: "#eab308" },
    4: { level: 4, label: "Forte", color: "#22c55e" },
    5: { level: 4, label: "Excelente", color: "#06b6d4" },
  };

  return { ...map[passed], checks };
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => calcPasswordStrength(password), [password]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center">
          <p className="text-sm text-red-300 mb-4">Link de redefinição inválido.</p>
          <Link href="/forgot-password" className="text-xs font-medium text-cyan-300 hover:text-cyan-200">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (strength.level < 3) {
      setError("A senha é fraca demais. Atenda aos requisitos mínimos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Erro ao redefinir senha.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-slate-50">Senha redefinida!</h1>
          <p className="text-xs text-slate-400">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(15,23,42,0.9)]">
        <div className="mb-5 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-fuchsia-500 shadow-[0_0_25px_rgba(34,211,238,0.6)]">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
            Nova senha
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Escolha uma nova senha segura para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Nova senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1 py-0.5 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: i <= strength.level ? strength.color : "rgba(51,65,85,0.4)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {strength.checks.map((check) => (
                    <span
                      key={check.label}
                      className={`text-[10px] flex items-center gap-1 ${check.passed ? "text-emerald-400" : "text-slate-500"}`}
                    >
                      <span className="text-[8px]">{check.passed ? "✓" : "○"}</span>
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Confirmar senha</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-lg bg-slate-950 border px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 transition-colors ${
                confirmPassword.length > 0 && confirmPassword !== password
                  ? "border-red-500/60"
                  : confirmPassword.length > 0 && confirmPassword === password
                  ? "border-emerald-500/60"
                  : "border-slate-800"
              }`}
              placeholder="Repita a senha"
            />
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="mt-1 text-[10px] text-red-400">As senhas não coincidem</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition-all active:scale-[0.98]"
          >
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
