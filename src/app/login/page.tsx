"use client";

import type { FormEvent } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslate } from "../components/LocaleContext";

import { getAnalyticsSessionId } from "@/lib/analytics";

type Mode = "login" | "register";

/* ── Password Strength ── */
type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function calcPasswordStrength(pw: string): {
  level: StrengthLevel;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: t("auth.passwordRequirements.min8", {}, "Mínimo 8 caracteres"), passed: pw.length >= 8 },
    { label: t("auth.passwordRequirements.uppercase", {}, "Letra maiúscula"), passed: /[A-Z]/.test(pw) },
    { label: t("auth.passwordRequirements.lowercase", {}, "Letra minúscula"), passed: /[a-z]/.test(pw) },
    { label: t("auth.passwordRequirements.number", {}, "Número"), passed: /\d/.test(pw) },
    { label: t("auth.passwordRequirements.special", {}, "Caractere especial (!@#$...)"), passed: /[^A-Za-z0-9]/.test(pw) },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const map: Record<number, { level: StrengthLevel; label: string; color: string }> = {
    0: { level: 0, label: "", color: "transparent" },
    1: { level: 1, label: t("auth.strength.veryWeak", {}, "Muito fraca"), color: "#ef4444" },
    2: { level: 2, label: t("auth.strength.weak", {}, "Fraca"), color: "#f97316" },
    3: { level: 3, label: t("auth.strength.good", {}, "Boa"), color: "#eab308" },
    4: { level: 4, label: t("auth.strength.strong", {}, "Forte"), color: "#22c55e" },
    5: { level: 4, label: t("auth.strength.excellent", {}, "Excelente"), color: "#06b6d4" },
  };

  return { ...map[passed], checks };
}

/* ── Social Icons ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedMode: Mode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<Mode>(resolvedMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [pending2fa, setPending2fa] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [verifying2fa, setVerifying2fa] = useState(false);

  const redirectTo = searchParams.get("from") || "/account";

  const t = useTranslate();
  const isRegister = mode === "register";

  // Mover cálculo de força para dentro do componente para ter acesso ao `t()`
  const strength = useMemo(() => {
    const checks = [
      { label: t("auth.passwordRequirements.min8", {}, "Mínimo 8 caracteres"), passed: password.length >= 8 },
      { label: t("auth.passwordRequirements.uppercase", {}, "Letra maiúscula"), passed: /[A-Z]/.test(password) },
      { label: t("auth.passwordRequirements.lowercase", {}, "Letra minúscula"), passed: /[a-z]/.test(password) },
      { label: t("auth.passwordRequirements.number", {}, "Número"), passed: /\d/.test(password) },
      { label: t("auth.passwordRequirements.special", {}, "Caractere especial (!@#$...)"), passed: /[^A-Za-z0-9]/.test(password) },
    ];

    const passed = checks.filter((c) => c.passed).length;
    const map: Record<number, { level: StrengthLevel; label: string; color: string }> = {
      0: { level: 0, label: "", color: "transparent" },
      1: { level: 1, label: t("auth.strength.veryWeak", {}, "Muito fraca"), color: "#ef4444" },
      2: { level: 2, label: t("auth.strength.weak", {}, "Fraca"), color: "#f97316" },
      3: { level: 3, label: t("auth.strength.good", {}, "Boa"), color: "#eab308" },
      4: { level: 4, label: t("auth.strength.strong", {}, "Forte"), color: "#22c55e" },
      5: { level: 4, label: t("auth.strength.excellent", {}, "Excelente"), color: "#06b6d4" },
    };

    return { ...map[passed], checks };
  }, [password, t]);

  useEffect(() => {
    setMode(resolvedMode);
  }, [resolvedMode]);

  function updateMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  }

  async function handleVerify2fa() {
    setError(null);
    setVerifying2fa(true);

    try {
      const res = await fetch("/api/auth/user/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: totpCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || t("auth.totp.invalidCode", {}, "Código inválido."));
        setVerifying2fa(false);
        return;
      }

      window.location.href = redirectTo;
    } catch {
      setError(t("auth.totp.unexpectedError", {}, "Erro inesperado. Tente novamente."));
      setVerifying2fa(false);
    }
  }

  async function handleSocialLogin(provider: string) {
    try {
      setLoading(true);
      setError(null);
      await signIn(provider.toLowerCase(), { callbackUrl: redirectTo });
    } catch {
      setError(t("auth.socialLoginError", {}, "Erro ao iniciar login com {provider}.").replace("{provider}", provider));
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Registration validations
    if (mode === "register") {
      if (password.length < 8) {
        setError(t("auth.passwordMin8Error", {}, "A senha deve ter no mínimo 8 caracteres."));
        return;
      }
      if (strength.level < 3) {
        setError(t("auth.weakPasswordError", {}, "A senha é fraca demais. Atenda aos requisitos mínimos."));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.passwordsDontMatch", {}, "As senhas não coincidem."));
        return;
      }
      if (!acceptedTerms) {
        setError(t("auth.termsNotAccepted", {}, "Você precisa aceitar os termos para criar uma conta."));
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(data.message || t("auth.invalidCredentials", {}, "Email ou senha inválidos."));
          setLoading(false);
          return;
        }

        // Check if 2FA is required
        if (data.requires2fa) {
          setPending2fa(true);
          setPendingToken(data.pendingToken);
          setLoading(false);
          return;
        }

        window.location.href = redirectTo;
        return;
      }

      // Registration remains custom via API
      const response = await fetch("/api/auth/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          sessionId: getAnalyticsSessionId(),
          referrer: document.referrer || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || t("auth.registerFailed", {}, "Não foi possível concluir o cadastro."));
        setLoading(false);
        return;
      }

      // O endpoint de registro já configura o cookie `PLAYER_SESSION_COOKIE` na resposta.
      window.location.href = redirectTo;
    } catch {
      setError(t("auth.unexpectedError", {}, "Falha inesperada. Tente novamente."));
      setLoading(false);
    }
  }

  // ── 2FA Verification Screen ──
  if (pending2fa) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(15,23,42,0.9)]">
          <div className="mb-5 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-fuchsia-500 shadow-[0_0_25px_rgba(34,211,238,0.6)]">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
              {t("auth.2fa.title", {}, "Verificação em duas etapas")}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {t("auth.2fa.subtitle", {}, "Insira o código do seu app autenticador ou um código de backup.")}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                {t("auth.2fa.codeLabel", {}, "Código de verificação")}
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="000000 ou XXXX-XXXX"
                autoFocus
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-center text-lg tracking-[0.2em] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleVerify2fa}
              disabled={verifying2fa || !totpCode}
              className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition-all"
            >
              {verifying2fa ? t("common.verifying", {}, "Verificando...") : t("common.verify", {}, "Verificar")}
            </button>

            <button
              type="button"
              onClick={() => {
                setPending2fa(false);
                setPendingToken("");
                setTotpCode("");
                setError(null);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-300"
            >
              {t("auth.2fa.backToLogin", {}, "Voltar ao login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(15,23,42,0.9)] scale-95 md:scale-100 transition-transform">

          {/* ── Header ── */}
          <div className="mb-5 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-fuchsia-500 shadow-[0_0_25px_rgba(34,211,238,0.6)]">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
              {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {isRegister
                ? t("auth.registerSubtitle")
                : t("auth.loginSubtitle")}
            </p>
          </div>

          {/* ── Mode Toggle ── */}
          <div className="flex rounded-full border border-slate-800 bg-slate-900/70 p-1 text-xs mb-5">
            <button
              type="button"
              onClick={() => updateMode("login")}
              className={`flex-1 rounded-full px-3 py-2 font-medium transition-colors ${
                mode === "login"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              {t("common.login")}
            </button>
            <button
              type="button"
              onClick={() => updateMode("register")}
              className={`flex-1 rounded-full px-3 py-2 font-medium transition-colors ${
                mode === "register"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              {t("common.register")}
            </button>
          </div>

          {/* ── Social Login ── */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800/80 hover:border-slate-700 active:scale-[0.98]"
            >
              <GoogleIcon />
              {t("auth.googleLogin")}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSocialLogin("Facebook")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800/80 hover:border-slate-700 active:scale-[0.98]"
              >
                <FacebookIcon />
                {t("auth.facebookLogin")}
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800/80 hover:border-slate-700 active:scale-[0.98]"
              >
                <AppleIcon />
                {t("auth.appleLogin")}
              </button>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">{t("auth.orEmail")}</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* ── Email Form ── */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t("auth.displayName", {}, "Nome de exibição")}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50"
                  placeholder="Ex.: Alex"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                {t("auth.email", {}, "Email")}
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

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                {t("auth.password", {}, "Senha")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50"
                  placeholder={isRegister ? t("auth.passwordMin8", {}, "Mínimo 8 caracteres") : t("auth.yourPassword", {}, "Sua senha")}
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

              {/* Forgot Password (login only) */}
              {!isRegister && (
                <div className="mt-1 text-right">
                  <Link href="/forgot-password" className="text-[11px] text-cyan-300 hover:text-cyan-200 font-medium">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
              )}

              {/* Password Strength (register only) */}
              {isRegister && password.length > 0 && (
                <div className="mt-2 space-y-2">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              i <= strength.level ? strength.color : "rgba(51,65,85,0.4)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[10px] font-semibold whitespace-nowrap"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {strength.checks.map((check) => (
                      <span
                        key={check.label}
                        className={`text-[10px] flex items-center gap-1 ${
                          check.passed ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        <span className="text-[8px]">{check.passed ? "✓" : "○"}</span>
                        {check.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (register only) */}
            {isRegister && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t("auth.confirmPassword", {}, "Confirmar senha")}
                </label>
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
                  placeholder={t("auth.repeatPassword", {}, "Repita a senha")}
                />
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="mt-1 text-[10px] text-red-400">{t("auth.passwordsDontMatch", {}, "As senhas não coincidem")}</p>
                )}
              </div>
            )}

            {/* Terms Acceptance (register only) */}
            {isRegister && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400/50 accent-cyan-400 shrink-0"
                />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  {t("auth.termsAcceptText", {}, "Tenho 13 anos (ou idade mínima aplicável) ou mais e aceito os")}{" "}
                  <Link href="/termos" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                    {t("auth.termsAndConditions", {}, "Termos e Condições")}
                  </Link>{" "}
                  {t("auth.andThe", {}, "e a")}{" "}
                  <Link href="/privacidade" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                    {t("auth.privacyPolicy", {}, "Política de Privacidade")}
                  </Link>
                  .
                </span>
              </label>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isRegister && !acceptedTerms)}
              className="w-full mt-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition-all active:scale-[0.98]"
            >
              {loading
                ? t("common.processing", {}, "Processando...")
                : isRegister
                ? t("auth.createAndEnter", {}, "Criar conta e entrar")
                : t("auth.enterAccount", {}, "Entrar na conta")}
            </button>
          </form>

          {/* ── Footer ── */}
          <p className="mt-4 text-center text-[10px] text-slate-500">
            {isRegister
              ? t("auth.alreadyHaveAccount", {}, "Já tem conta? ")
              : t("auth.dontHaveAccount", {}, "Não tem conta? ")}
            <button
              type="button"
              onClick={() => updateMode(isRegister ? "login" : "register")}
              className="text-cyan-300 hover:text-cyan-200 font-medium"
            >
              {isRegister ? t("common.login", {}, "Faça login") : t("auth.createNow", {}, "Crie agora")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}