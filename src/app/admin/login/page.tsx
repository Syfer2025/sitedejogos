"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.replace("/admin/games");
    } catch {
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_0_35px_rgba(15,23,42,0.9)]">
        <div className="mb-5 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]" />
          <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-50">
            Admin Access
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Restricted area. Use your administrator credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400/80"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400/80"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 text-xs font-medium text-white shadow-[0_0_22px_rgba(147,51,234,0.7)] transition-colors"
          >
            {loading ? "Signing in..." : "Sign in as Admin"}
          </button>

          <p className="mt-2 text-[10px] text-slate-500 text-center">
            This login is strictly for administrators and does not grant access
            to player accounts.
          </p>
        </form>
      </div>
    </div>
  );
}
