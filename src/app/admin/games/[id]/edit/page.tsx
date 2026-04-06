"use client";

import { useRouter, useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type AdminGame = {
  id: string;
  title: string;
  slug: string;
  iframeUrl: string;
  thumbnail: string;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminEditGamePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [game, setGame] = useState<AdminGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/games/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = (await res.json()) as AdminGame;
        setGame(data);
      } catch {
        setError("Erro ao carregar jogo");
      } finally {
        setLoading(false);
      }
    }
    if (params?.id) {
      load();
    }
  }, [params?.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!game) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") || "").trim(),
      iframeUrl: String(formData.get("iframeUrl") || "").trim(),
      thumbnail: String(formData.get("thumbnail") || "").trim(),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || ""),
      tags: String(formData.get("tags") || ""),
      featured: formData.get("featured") === "on",
      isPublished: formData.get("isPublished") === "on",
    };

    if (!payload.title || !payload.iframeUrl || !payload.thumbnail) {
      setError("Título, iframe URL e thumbnail são obrigatórios.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
      router.push("/admin/games");
    } catch {
      setError("Erro ao atualizar jogo. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!game) return;
    const ok = window.confirm("Tem certeza que deseja excluir este jogo?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      router.push("/admin/games");
    } catch {
      alert("Erro ao excluir jogo.");
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Carregando jogo...</p>;
  }

  if (error || !game) {
    return (
      <p className="text-xs text-red-400">
        {error || "Jogo não encontrado."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            Editar jogo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Atualize as informações do jogo HTML5 exibido no portal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="text-[11px] text-red-300 hover:text-red-200"
        >
          Excluir jogo
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 text-xs"
      >
        {error && <p className="text-red-400 text-[11px]">{error}</p>}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-[11px]">
              Título do jogo
            </label>
            <input
              name="title"
              defaultValue={game.title}
              className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-[11px]">
              Categoria
            </label>
            <input
              name="category"
              defaultValue={game.category}
              className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-300 text-[11px]">
            URL do iframe (GameMonetize / HTML5)
          </label>
          <input
            name="iframeUrl"
            defaultValue={game.iframeUrl}
            className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-300 text-[11px]">
            URL da thumbnail
          </label>
          <input
            name="thumbnail"
            defaultValue={game.thumbnail}
            className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-300 text-[11px]">
            Descrição
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={game.description}
            className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-300 text-[11px]">
            Tags (separadas por vírgula)
          </label>
          <input
            name="tags"
            defaultValue={game.tags.join(", ")}
            className="w-full rounded-md bg-slate-900/80 border border-slate-700/80 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={game.featured}
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
            />
            <span>Marcar como destaque</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={game.isPublished}
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
            />
            <span>Publicado</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin/games")}
            className="px-3 py-1 rounded-md border border-slate-700/80 text-[11px] text-slate-300 hover:bg-slate-900/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-[11px] font-medium text-white shadow-[0_0_18px_rgba(147,51,234,0.6)]"
          >
            {submitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
