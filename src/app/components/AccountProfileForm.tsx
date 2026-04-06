"use client";

import { startTransition, useState } from "react";

import { useRouter } from "next/navigation";

import { AVATAR_PRESETS } from "@/data/avatarPresets";

type AccountProfileFormProps = {
  initialProfile: {
    displayName: string;
    email: string;
    avatarUrl: string;
    bio: string;
    preferredCategories: string[];
  };
  categories: string[];
  variant?: "card" | "embedded";
};

function getPlayerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AccountProfileForm({
  initialProfile,
  categories,
  variant = "card",
}: AccountProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [bio, setBio] = useState(initialProfile.bio);
  const [preferredCategories, setPreferredCategories] = useState(
    initialProfile.preferredCategories,
  );
  const [pending, setPending] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const playerInitials = getPlayerInitials(displayName || initialProfile.displayName);
  const isEmbedded = variant === "embedded";

  function toggleCategory(category: string) {
    setFeedback(null);

    setPreferredCategories((current) => {
      if (current.includes(category)) {
        return current.filter((entry) => entry !== category);
      }

      if (current.length >= 4) {
        setFeedback({
          type: "error",
          message: "Selecione no máximo 4 categorias favoritas.",
        });
        return current;
      }

      return [...current, category];
    });
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Não foi possível enviar a foto.",
        });
        return;
      }

      setAvatarUrl(data.url);
      setFeedback({
        type: "success",
        message: "Foto enviada. Salve o perfil para confirmar a troca.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha inesperada ao enviar a foto.",
      });
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  function applyAvatarPreset(url: string) {
    setAvatarUrl(url);
    setFeedback({
      type: "success",
      message: "Avatar preset selecionado. Salve o perfil para aplicar.",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim(),
          bio: bio.trim(),
          preferredCategories,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            displayName?: string;
            avatarUrl?: string;
            bio?: string;
            preferredCategories?: string[];
            error?: string;
          }
        | null;

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Não foi possível atualizar seu perfil.",
        });
        return;
      }

      setDisplayName(data?.displayName ?? displayName.trim());
      setAvatarUrl(data?.avatarUrl ?? avatarUrl.trim());
      setBio(data?.bio ?? bio.trim());
      setPreferredCategories(data?.preferredCategories ?? preferredCategories);
      setFeedback({
        type: "success",
        message: "Perfil atualizado com sucesso.",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha inesperada ao salvar o perfil.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className={
        isEmbedded
          ? "grid gap-6 lg:grid-cols-[1.15fr,0.85fr]"
          : "grid gap-6 rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(2,6,23,0.5)] lg:grid-cols-[1.15fr,0.85fr]"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
            {isEmbedded ? "Dados principais" : "Perfil do jogador"}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">
            {isEmbedded
              ? "Edite o que aparece no seu perfil"
              : "Personalize sua conta e suas recomendações"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isEmbedded
              ? "Nome, avatar, bio e até 4 categorias para ajustar a apresentação da sua conta."
              : "Ajuste nome, avatar, bio curta e até 4 categorias para melhorar a área personalizada do portal."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Nome de exibição
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              placeholder="Seu nome no portal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={initialProfile.email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            URL do avatar
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
            placeholder="https://..."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 transition-colors hover:border-cyan-500/60 hover:text-slate-100">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {uploadingAvatar ? "Enviando foto..." : "Enviar minha foto"}
            </label>
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 transition-colors hover:border-slate-500 hover:text-slate-100"
            >
              Remover avatar
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <label className="font-medium text-slate-300">Avatares prontos</label>
            <span className="text-slate-500">Escolha rápida para sua conta</span>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {AVATAR_PRESETS.map((preset) => {
              const active = avatarUrl === preset.url;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAvatarPreset(preset.url)}
                  className={`group rounded-2xl border p-2 transition-colors ${
                    active
                      ? "border-cyan-400/70 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-cyan-500/40"
                  }`}
                  title={preset.label}
                >
                  <div
                    className="h-14 w-full rounded-xl border border-slate-800 bg-slate-900 bg-cover bg-center"
                    style={{ backgroundImage: `url("${preset.url}")` }}
                  />
                  <span className="mt-2 block text-[10px] text-slate-400 group-hover:text-slate-200">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <label className="font-medium text-slate-300">Bio curta</label>
            <span className="text-slate-500">{bio.length}/240</span>
          </div>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 240))}
            rows={isEmbedded ? 3 : 4}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
            placeholder="Conte um pouco sobre os gêneros que você mais curte jogar."
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <label className="font-medium text-slate-300">
              Categorias favoritas
            </label>
            <span className="text-slate-500">
              {preferredCategories.length}/4 selecionadas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = preferredCategories.includes(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                      : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-500/50 hover:text-slate-50"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <p
            className={`rounded-xl border px-3 py-2 text-xs ${
              feedback.type === "success"
                ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
                : "border-red-900/60 bg-red-950/30 text-red-300"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Salvando perfil..." : "Salvar perfil"}
        </button>
      </form>

      <div className="rounded-[24px] border border-slate-800 bg-slate-900/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Prévia
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-cyan-400/20 bg-slate-950 text-2xl font-semibold text-slate-50"
            style={
              avatarUrl.trim()
                ? {
                    backgroundImage: `url("${avatarUrl.trim()}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          >
            {avatarUrl.trim() ? null : playerInitials}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-50">
              {displayName.trim() || initialProfile.displayName}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{initialProfile.email}</p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
          {bio.trim() || "Adicione uma bio curta para dar contexto ao seu perfil."}
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-300">Categorias em destaque</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferredCategories.length > 0 ? (
              preferredCategories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100"
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">
                Escolha categorias para personalizar recomendações.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}