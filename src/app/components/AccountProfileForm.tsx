"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { AVATAR_PRESETS } from "@/data/avatarPresets";
import { COVER_PRESETS } from "@/data/coverPresets";

type AccountProfileFormProps = {
  initialProfile: {
    displayName: string;
    email: string;
    avatarUrl: string;
    coverUrl: string;
    bio: string;
    preferredCategories: string[];
    unlockedAvatars?: string[];
    unlockedCovers?: string[];
    coins?: number;
  };
  categories: string[];
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
}: AccountProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(initialProfile.coverUrl);
  const [bio, setBio] = useState(initialProfile.bio);
  const [preferredCategories, setPreferredCategories] = useState(initialProfile.preferredCategories);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const playerInitials = getPlayerInitials(displayName || initialProfile.displayName);

  async function handleBuyItem(itemType: "avatar" | "cover", preset: { id: string; url: string; price?: number }) {
    if ((initialProfile.coins ?? 0) < (preset.price ?? 0)) {
      setFeedback({ type: "error", message: `Moedas insuficientes. Precisas de ${preset.price} moedas.` });
      return;
    }
    
    setFeedback({ type: "success", message: "Processando compra..." });
    try {
      const res = await fetch("/api/user/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId: preset.id })
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Item desbloqueado com sucesso!" });
        if (itemType === "avatar") {
           setAvatarUrl(preset.url);
           setShowAvatarPicker(false);
        }
        if (itemType === "cover") {
           setCoverUrl(preset.url);
           setShowCoverPicker(false);
        }
        startTransition(() => router.refresh());
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFeedback({ type: "error", message: errorData.error || "Falha na compra." });
      }
    } catch {
      setFeedback({ type: "error", message: "Erro de comunicação." });
    }
  }

  function toggleCategory(category: string) {
    setFeedback(null);
    setPreferredCategories((current) => {
      if (current.includes(category)) return current.filter((e) => e !== category);
      if (current.length >= 4) {
        setFeedback({ type: "error", message: "Selecione no máximo 4 categorias." });
        return current;
      }
      return [...current, category];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim(),
          coverUrl: coverUrl.trim(),
          bio: bio.trim(),
          preferredCategories,
        }),
      });

      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      if (!response.ok) {
        setFeedback({ type: "error", message: (data?.error as string) ?? "Erro ao salvar perfil." });
        return;
      }

      setDisplayName((data?.displayName as string) ?? displayName.trim());
      setAvatarUrl((data?.avatarUrl as string) ?? avatarUrl.trim());
      setCoverUrl((data?.coverUrl as string) ?? coverUrl.trim());
      setBio((data?.bio as string) ?? bio.trim());
      setPreferredCategories((data?.preferredCategories as string[]) ?? preferredCategories);
      setFeedback({ type: "success", message: "Perfil atualizado com sucesso!" });
      startTransition(() => router.refresh());
    } catch {
      setFeedback({ type: "error", message: "Falha ao salvar o perfil." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ═══════ Facebook-style cover + avatar ═══════ */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/60">
        {/* Cover image */}
        <div
          className="relative h-40 sm:h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-cover bg-center transition-all duration-500"
          style={coverUrl.trim() ? { backgroundImage: `url("${coverUrl.trim()}")` } : undefined}
        >
          {/* Cover overlay + change button */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <button
            type="button"
            onClick={() => { setShowCoverPicker(!showCoverPicker); setShowAvatarPicker(false); }}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/20 bg-slate-950/60 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-slate-950/80 hover:text-white"
          >
            📷 Trocar capa
          </button>
        </div>

        {/* Avatar overlapping cover */}
        <div className="relative -mt-12 ml-5 sm:ml-8 flex items-end gap-4">
          <button
            type="button"
            onClick={() => { setShowAvatarPicker(!showAvatarPicker); setShowCoverPicker(false); }}
            className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-950 bg-slate-900 text-2xl font-bold text-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all hover:border-cyan-500/50 overflow-hidden"
          >
            {avatarUrl.trim() ? (
              <img src={avatarUrl.trim()} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              playerInitials
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-sm text-white">📷</span>
            </div>
          </button>
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-50">{displayName.trim() || initialProfile.displayName}</h3>
            <p className="text-xs text-slate-500">{initialProfile.email}</p>
          </div>
        </div>

        {/* Cover picker dropdown */}
        {showCoverPicker && (
          <div className="border-t border-slate-800/60 bg-slate-950/95 p-4 animate-fade-in">
            <p className="text-xs font-semibold text-slate-300 mb-3">Escolha uma capa</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COVER_PRESETS.map((preset) => {
                const active = coverUrl === preset.url;
                const isPremium = preset.isPremium ?? false;
                const price = preset.price ?? 0;
                const isUnlocked = !isPremium || !!initialProfile.unlockedCovers?.includes(preset.id);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (!isUnlocked) {
                        handleBuyItem("cover", { id: preset.id, url: preset.url, price });
                      } else {
                        setCoverUrl(preset.url);
                        setShowCoverPicker(false);
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl border transition-all ${
                      active ? "border-cyan-400/60 ring-2 ring-cyan-400/30" : "border-slate-700 hover:border-cyan-500/40"
                    }`}
                  >
                    <div
                      className={`h-16 w-full bg-cover bg-center ${!isUnlocked ? "opacity-50 grayscale" : ""}`}
                      style={{ backgroundImage: `url("${preset.url}")` }}
                    />
                    
                    {!isUnlocked ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
                          <span className="text-sm shadow-black drop-shadow-md">🔒</span>
                          <span className="text-[10px] font-bold text-amber-300 drop-shadow-md">{price}💰</span>
                       </div>
                    ) : null}

                    <p className="bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 relative z-10">{preset.label}</p>
                    
                    {active && (
                      <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] text-slate-950 z-10">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Avatar picker dropdown */}
        {showAvatarPicker && (
          <div className="border-t border-slate-800/60 bg-slate-950/95 p-4 animate-fade-in">
            <p className="text-xs font-semibold text-slate-300 mb-3">Escolha um avatar</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_PRESETS.filter(p => !p.isPremium || initialProfile.unlockedAvatars?.includes(p.id)).map((preset) => {
                const active = avatarUrl === preset.url;
                const isPremium = preset.isPremium ?? false;
                const price = preset.price ?? 0;
                const isUnlocked = !isPremium || !!initialProfile.unlockedAvatars?.includes(preset.id);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowAvatarPicker(false);
                    }}
                    className={`relative group rounded-xl border p-1.5 transition-all ${
                      active ? "border-cyan-400/60 bg-cyan-500/10" : "border-slate-800 hover:border-cyan-500/40"
                    }`}
                    title={preset.label}
                  >
                    <div
                      className={`h-12 w-full rounded-lg border border-slate-800 bg-slate-900 bg-cover bg-center`}
                      style={{ backgroundImage: `url("${preset.url}")` }}
                    />
                    
                    <span className="mt-1 block text-[9px] text-slate-500 group-hover:text-slate-300">{preset.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { setAvatarUrl(""); setShowAvatarPicker(false); }}
              className="mt-3 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:text-slate-200 hover:border-slate-600"
            >
              Remover avatar
            </button>
          </div>
        )}
      </div>

      {/* ═══════ Form fields ═══════ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left column: Name + Bio */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Nome de exibição</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              placeholder="Seu nome no portal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={initialProfile.email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-500"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300">Bio curta</label>
              <span className="text-slate-500">{bio.length}/240</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 240))}
              rows={3}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              placeholder="Conte sobre seus jogos favoritos..."
            />
          </div>
        </div>

        {/* Right column: Categories */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300">Categorias favoritas</label>
              <span className="text-slate-500">{preferredCategories.length}/4</span>
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
                        : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-500/50"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-3">Prévia do perfil</p>
            <p className="text-sm text-slate-300 italic">
              {bio.trim() || "Adicione uma bio..."}
            </p>
            {preferredCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {preferredCategories.map((cat) => (
                  <span key={cat} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100">{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Feedback + Submit ═══════ */}
      {feedback && (
        <p className={`rounded-xl border px-3 py-2.5 text-xs ${
          feedback.type === "success"
            ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
            : "border-red-900/60 bg-red-950/30 text-red-300"
        }`}>
          {feedback.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}