"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  ACHIEVEMENT_CRITERIA_LABELS,
  ACHIEVEMENT_CRITERIA_TYPES,
  type AchievementCriteriaType,
} from "@/lib/gamification";

type AchievementDefinition = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  criteriaType: AchievementCriteriaType;
  threshold: number;
  xpReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id: string | null;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  criteriaType: AchievementCriteriaType;
  threshold: number;
  xpReward: number;
  isActive: boolean;
};

type AdminTab = "catalog" | "media";

const INITIAL_FORM: FormState = {
  id: null,
  key: "",
  title: "",
  description: "",
  icon: "",
  imageUrl: "",
  criteriaType: "unique_games_played",
  threshold: 1,
  xpReward: 20,
  isActive: true,
};

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<AchievementDefinition[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<AdminTab>("catalog");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaUploadingId, setMediaUploadingId] = useState<string | null>(null);
  const [mediaSavingId, setMediaSavingId] = useState<string | null>(null);
  const [mediaUrlDrafts, setMediaUrlDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/achievements?includeInactive=true");

        if (!response.ok) {
          throw new Error("Falha ao carregar conquistas");
        }

        const data = (await response.json()) as AchievementDefinition[];

        if (active) {
          setItems(data);
          setMediaUrlDrafts(Object.fromEntries(data.map((item) => [item.id, item.imageUrl])));
        }
      } catch {
        if (active) {
          setFeedback({ type: "error", message: "Não foi possível carregar as conquistas." });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function hydrateForm(item: AchievementDefinition) {
    setForm({
      id: item.id,
      key: item.key,
      title: item.title,
      description: item.description,
      icon: item.icon,
      imageUrl: item.imageUrl,
      criteriaType: item.criteriaType,
      threshold: item.threshold,
      xpReward: item.xpReward,
      isActive: item.isActive,
    });
    setFeedback(null);
  }

  async function refreshItems() {
    const response = await fetch("/api/admin/achievements?includeInactive=true");
    const data = (await response.json()) as AchievementDefinition[];
    setItems(data);
    setMediaUrlDrafts(Object.fromEntries(data.map((item) => [item.id, item.imageUrl])));
    setForm((current) => {
      if (!current.id) {
        return current;
      }

      const updatedItem = data.find((item) => item.id === current.id);

      if (!updatedItem) {
        return current;
      }

      return {
        id: updatedItem.id,
        key: updatedItem.key,
        title: updatedItem.title,
        description: updatedItem.description,
        icon: updatedItem.icon,
        imageUrl: updatedItem.imageUrl,
        criteriaType: updatedItem.criteriaType,
        threshold: updatedItem.threshold,
        xpReward: updatedItem.xpReward,
        isActive: updatedItem.isActive,
      };
    });
  }

  async function uploadAchievementMedia(file: File) {
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/admin/achievements/upload", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !data?.url) {
      throw new Error(data?.error ?? "Não foi possível enviar a mídia da conquista.");
    }

    return data.url;
  }

  async function patchAchievementMedia(id: string, imageUrl: string) {
    const response = await fetch(`/api/admin/achievements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(data?.error ?? "Não foi possível atualizar a mídia da conquista.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        key: form.key.trim() || undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        imageUrl: form.imageUrl.trim(),
        criteriaType: form.criteriaType,
        threshold: form.threshold,
        xpReward: form.xpReward,
        isActive: form.isActive,
      };

      const response = await fetch(
        form.id ? `/api/admin/achievements/${form.id}` : "/api/admin/achievements",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Não foi possível salvar a conquista.",
        });
        return;
      }

      await refreshItems();
      resetForm();
      setFeedback({
        type: "success",
        message: form.id ? "Conquista atualizada." : "Conquista criada com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha inesperada ao salvar a conquista.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setFeedback(null);

    const confirmed = window.confirm("Remover esta conquista do catálogo admin?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/achievements/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback({ type: "error", message: "Não foi possível remover a conquista." });
      return;
    }

    await refreshItems();
    if (form.id === id) {
      resetForm();
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const url = await uploadAchievementMedia(file);

      setForm((current) => ({ ...current, imageUrl: url }));
      setFeedback({
        type: "success",
        message: "Mídia enviada. Salve a conquista para confirmar.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao enviar a mídia da conquista.",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleMediaUpload(itemId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMediaUploadingId(itemId);
    setFeedback(null);

    try {
      const url = await uploadAchievementMedia(file);

      await patchAchievementMedia(itemId, url);
      await refreshItems();
      setFeedback({
        type: "success",
        message: "GIF da conquista atualizado com sucesso.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao atualizar o GIF da conquista.",
      });
    } finally {
      setMediaUploadingId(null);
      event.target.value = "";
    }
  }

  async function handleMediaUrlSave(itemId: string) {
    setMediaSavingId(itemId);
    setFeedback(null);

    try {
      await patchAchievementMedia(itemId, mediaUrlDrafts[itemId]?.trim() ?? "");
      await refreshItems();
      setFeedback({
        type: "success",
        message: "URL de mídia atualizada.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao salvar a URL de mídia.",
      });
    } finally {
      setMediaSavingId(null);
    }
  }

  async function handleMediaClear(itemId: string) {
    setMediaSavingId(itemId);
    setFeedback(null);

    try {
      await patchAchievementMedia(itemId, "");
      await refreshItems();
      setFeedback({
        type: "success",
        message: "Mídia removida da conquista.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao remover a mídia da conquista.",
      });
    } finally {
      setMediaSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
            Gamificacao
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Conquistas do portal
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Edite regras, fallback de ícone e uma aba dedicada para GIFs e mídia de cada conquista.
          </p>
        </div>
      </header>

      <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-950/70 p-1 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`rounded-xl px-4 py-2 transition-colors ${
            activeTab === "catalog"
              ? "bg-amber-400 text-slate-950"
              : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Cadastro e regras
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`rounded-xl px-4 py-2 transition-colors ${
            activeTab === "media"
              ? "bg-cyan-300 text-slate-950"
              : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          Mídia e GIFs
        </button>
      </div>

      {activeTab === "catalog" ? (
      <section className="grid gap-6 xl:grid-cols-[1.05fr,1.35fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
              {form.id ? "Editar conquista" : "Nova conquista"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              Monte o badge e a regra de desbloqueio
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Ex.: Mestre do Drift"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Chave opcional</label>
              <input
                type="text"
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="mestre-do-drift"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Descrição</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="Explique ao jogador como essa conquista é desbloqueada."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Icone de fallback</label>
              <input
                type="text"
                value={form.icon}
                onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Ex.: 🏁"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">XP de recompensa</label>
              <input
                type="number"
                min={0}
                value={form.xpReward}
                onChange={(event) =>
                  setForm((current) => ({ ...current, xpReward: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Regra</label>
              <select
                value={form.criteriaType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    criteriaType: event.target.value as AchievementCriteriaType,
                  }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                {ACHIEVEMENT_CRITERIA_TYPES.map((criteria) => (
                  <option key={criteria} value={criteria}>
                    {ACHIEVEMENT_CRITERIA_LABELS[criteria]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Alvo</label>
              <input
                type="number"
                min={1}
                value={form.threshold}
                onChange={(event) =>
                  setForm((current) => ({ ...current, threshold: Number(event.target.value) || 1 }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Mídia da conquista</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="https://... ou /uploads/achievements/..."
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 transition-colors hover:border-amber-500/60 hover:text-slate-100">
                <input
                  type="file"
                  accept="image/gif,image/webp,image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {uploading ? "Enviando mídia..." : "Enviar GIF/Imagem"}
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-950 text-amber-300"
                />
                Conquista ativa
              </label>
            </div>
          </div>

          {feedback ? (
            <p
              className={`rounded-2xl border px-3 py-2 text-xs ${
                feedback.type === "success"
                  ? "border-emerald-800/70 bg-emerald-950/30 text-emerald-300"
                  : "border-red-800/70 bg-red-950/30 text-red-300"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-70"
            >
              {saving ? "Salvando..." : form.id ? "Atualizar conquista" : "Criar conquista"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
            >
              Limpar
            </button>
          </div>
        </form>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Catalogo atual
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">
                {items.length} conquista(s) registradas
              </h2>
            </div>
            {loading ? <span className="text-xs text-slate-500">Carregando...</span> : null}
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <div
                        className="h-14 w-14 rounded-2xl border border-slate-800 bg-slate-950 bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-2xl">
                        {item.icon || "*"}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            item.isActive
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                              : "border-slate-700 bg-slate-950/70 text-slate-400"
                          }`}
                        >
                          {item.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-slate-400">{item.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                        <span>{item.key}</span>
                        <span>•</span>
                        <span>{ACHIEVEMENT_CRITERIA_LABELS[item.criteriaType]}</span>
                        <span>•</span>
                        <span>Meta {item.threshold}</span>
                        <span>•</span>
                        <span>+{item.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => hydrateForm(item)}
                      className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-amber-500/60 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-red-500/70 hover:text-red-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && items.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
                Nenhuma conquista cadastrada ainda.
              </p>
            ) : null}
          </div>
        </section>
      </section>
      ) : (
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                Biblioteca visual
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">
                Upload direto de GIFs por conquista
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400">
                Envie um GIF ou outra mídia para cada badge e salve na hora, sem precisar entrar no editor principal.
              </p>
            </div>
            {loading ? <span className="text-xs text-slate-500">Carregando...</span> : null}
          </div>

          {feedback ? (
            <p
              className={`rounded-2xl border px-3 py-2 text-xs ${
                feedback.type === "success"
                  ? "border-emerald-800/70 bg-emerald-950/30 text-emerald-300"
                  : "border-red-800/70 bg-red-950/30 text-red-300"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((item) => {
              const mediaUrl = mediaUrlDrafts[item.id] ?? item.imageUrl;
              const isSavingThisItem = mediaSavingId === item.id;
              const isUploadingThisItem = mediaUploadingId === item.id;
              const isAnimatedGif = /\.gif($|\?)/i.test(mediaUrl);

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                      {mediaUrl ? (
                        <Image
                          src={mediaUrl}
                          alt={item.title}
                          fill
                          sizes="64px"
                          unoptimized={isAnimatedGif}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                          {item.icon || "*"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-[10px] text-slate-400">
                          {item.key}
                        </span>
                        {mediaUrl ? (
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            {isAnimatedGif ? "GIF ativo" : "Mídia ativa"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px] text-slate-400">{item.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">URL da mídia</label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <input
                          type="text"
                          value={mediaUrl}
                          onChange={(event) =>
                            setMediaUrlDrafts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                          placeholder="/uploads/achievements/...gif"
                        />
                        <button
                          type="button"
                          onClick={() => void handleMediaUrlSave(item.id)}
                          disabled={isSavingThisItem}
                          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:border-cyan-400 hover:bg-cyan-500/15 disabled:opacity-60"
                        >
                          {isSavingThisItem ? "Salvando..." : "Salvar URL"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 transition-colors hover:border-cyan-500/60 hover:text-slate-100">
                        <input
                          type="file"
                          accept="image/gif,image/webp,image/png,image/jpeg,image/svg+xml"
                          className="hidden"
                          onChange={(event) => void handleMediaUpload(item.id, event)}
                        />
                        {isUploadingThisItem ? "Enviando GIF..." : "Enviar GIF/Imagem"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          hydrateForm(item);
                          setActiveTab("catalog");
                        }}
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-amber-500/60 hover:text-white"
                      >
                        Abrir no editor
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleMediaClear(item.id)}
                        disabled={isSavingThisItem || (!item.imageUrl && !(mediaUrlDrafts[item.id] ?? "").trim())}
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-red-500/70 hover:text-red-200 disabled:opacity-50"
                      >
                        Remover mídia
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}