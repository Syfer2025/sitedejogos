"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getAnalyticsSessionId } from "@/lib/analytics";

type FavoriteButtonProps = {
  gameId: string;
  gameSlug: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
};

export function FavoriteButton({
  gameId,
  gameSlug,
  initialFavorited,
  isAuthenticated,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (!isAuthenticated) {
      router.push(`/login?from=/games/${gameSlug}`);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        favorited ? `/api/user/favorites/${gameId}` : "/api/user/favorites",
        favorited
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                gameId,
                sessionId: getAnalyticsSessionId(),
                referrer: window.location.pathname,
              }),
            },
      );

      if (!response.ok) {
        throw new Error("Falha ao atualizar favoritos.");
      }

      setFavorited((current) => !current);
      router.refresh();
    } catch {
      setError("Não foi possível atualizar seus favoritos.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
          favorited
            ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
            : "border-slate-700 bg-slate-950/80 text-slate-200 hover:border-purple-500/80 hover:text-white"
        }`}
      >
        {pending
          ? "Salvando..."
          : favorited
          ? "★ Favoritado"
          : "☆ Adicionar aos favoritos"}
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}