"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de verificação inválido.");
      return;
    }

    fetch("/api/auth/user/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage("Email verificado com sucesso!");
          setTimeout(() => router.push("/account"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Falha na verificação.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erro inesperado. Tente novamente.");
      });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center shadow-[0_0_50px_rgba(15,23,42,0.9)]">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="text-sm text-slate-300">Verificando seu email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-slate-50">{message}</h1>
            <p className="text-xs text-slate-400">
              Redirecionando para sua conta...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-2xl">✕</span>
            </div>
            <h1 className="mb-2 text-lg font-semibold text-slate-50">
              Verificação falhou
            </h1>
            <p className="mb-6 text-sm text-slate-400">{message}</p>
            <Link
              href="/account"
              className="inline-block rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Ir para minha conta
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
