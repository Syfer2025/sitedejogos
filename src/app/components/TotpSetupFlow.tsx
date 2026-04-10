"use client";

import { useState } from "react";

type Step = "idle" | "qr" | "verify" | "backup" | "done";

export function TotpSetupFlow({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState<Step>("idle");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(enabled);
  const [showDisable, setShowDisable] = useState(false);

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/user/totp/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erro ao iniciar setup.");
        return;
      }
      setQrCode(data.qrCodeDataUrl);
      setStep("qr");
    } catch {
      setError("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function verifySetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/user/totp/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Código inválido.");
        setLoading(false);
        return;
      }
      setBackupCodes(data.backupCodes);
      setStep("backup");
      setIs2faEnabled(true);
    } catch {
      setError("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function disable2fa() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/user/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Código inválido.");
        setLoading(false);
        return;
      }
      setIs2faEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      setStep("idle");
    } catch {
      setError("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Autenticação em duas etapas (2FA)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {is2faEnabled
              ? "Ativado — seu login exige um código do app autenticador."
              : "Desativado — ative para proteger sua conta."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            is2faEnabled
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-slate-700/50 text-slate-400"
          }`}
        >
          {is2faEnabled ? "Ativado" : "Desativado"}
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {/* Idle: Enable or Disable button */}
      {step === "idle" && !showDisable && (
        <div>
          {is2faEnabled ? (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Desativar 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={startSetup}
              disabled={loading}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
            >
              {loading ? "Carregando..." : "Ativar 2FA"}
            </button>
          )}
        </div>
      )}

      {/* Disable flow */}
      {showDisable && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-300">
            Para desativar, insira um código do app autenticador ou um código de
            backup.
          </p>
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="Código de 6 dígitos ou backup"
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={disable2fa}
              disabled={loading || !disableCode}
              className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisable(false);
                setDisableCode("");
                setError(null);
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Step: Show QR code */}
      {step === "qr" && (
        <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
          <p className="text-xs text-slate-300">
            Escaneie o QR code com seu app autenticador (Google Authenticator,
            Authy, etc.)
          </p>
          {qrCode && (
            <img
              src={qrCode}
              alt="QR Code para 2FA"
              className="mx-auto rounded-lg"
              width={200}
              height={200}
            />
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300 text-left">
              Código de verificação
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-center text-lg tracking-[0.3em] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            />
          </div>
          <button
            type="button"
            onClick={verifySetup}
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verificando..." : "Verificar e ativar"}
          </button>
        </div>
      )}

      {/* Step: Show backup codes */}
      {step === "backup" && (
        <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-lg">✓</span>
            </div>
            <h4 className="text-sm font-semibold text-emerald-200">
              2FA ativado com sucesso!
            </h4>
          </div>

          <div>
            <p className="text-xs font-semibold text-amber-200 mb-2">
              Códigos de backup — salve em um lugar seguro!
            </p>
            <p className="text-[10px] text-amber-300/70 mb-3">
              Cada código só pode ser usado uma vez. Use-os caso perca acesso ao
              app autenticador.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((bc) => (
                <div
                  key={bc}
                  className="rounded-md bg-slate-950/60 border border-slate-700 px-3 py-1.5 text-center font-mono text-sm text-slate-200"
                >
                  {bc}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-400"
            />
            <span className="text-xs text-slate-300">
              Salvei meus códigos de backup em lugar seguro
            </span>
          </label>

          <button
            type="button"
            onClick={() => setStep("idle")}
            disabled={!saved}
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
          >
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}
