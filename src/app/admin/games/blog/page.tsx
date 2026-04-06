"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  coverImageUrl: string;
  excerpt: string;
  content: string;
  readingTime: string;
  publishedAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id: string | null;
  slug: string;
  title: string;
  category: string;
  coverImageUrl: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
};

const INITIAL_FORM: FormState = {
  id: null,
  slug: "",
  title: "",
  category: "SEO",
  coverImageUrl: "",
  excerpt: "",
  content: "",
  isPublished: false,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  async function refreshPosts() {
    const response = await fetch("/api/admin/blog");
    if (!response.ok) {
      throw new Error("Falha ao carregar posts");
    }

    const data = (await response.json()) as AdminBlogPost[];
    setPosts(data);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        await refreshPosts();
      } catch {
        if (active) {
          setFeedback({ type: "error", message: "Não foi possível carregar os posts." });
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

  function editPost(post: AdminBlogPost) {
    setForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      coverImageUrl: post.coverImageUrl,
      excerpt: post.excerpt,
      content: post.content,
      isPublished: post.isPublished,
    });
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        slug: form.slug.trim() || undefined,
        title: form.title.trim(),
        category: form.category.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        isPublished: form.isPublished,
      };

      const response = await fetch(form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Não foi possível salvar o post.",
        });
        return;
      }

      await refreshPosts();
      resetForm();
      setFeedback({
        type: "success",
        message: form.id
          ? "Post atualizado com sucesso."
          : payload.isPublished
          ? "Post publicado e notificações disparadas."
          : "Rascunho salvo com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha inesperada ao salvar o post.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingCover(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/blog/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null;

      if (!response.ok || !data?.url) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Não foi possível enviar a imagem de capa.",
        });
        return;
      }

      setForm((current) => ({ ...current, coverImageUrl: data.url ?? "" }));
      setFeedback({
        type: "success",
        message: "Imagem de capa enviada com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha inesperada ao enviar a imagem de capa.",
      });
    } finally {
      event.target.value = "";
      setUploadingCover(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Excluir este post do blog?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/blog/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback({ type: "error", message: "Não foi possível excluir o post." });
      return;
    }

    await refreshPosts();
    if (form.id === id) {
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
            Conteudo
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Blog do portal
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Crie rascunhos, publique posts e dispare notificações para os jogadores no momento da publicação.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,1.35fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
              {form.id ? "Editar post" : "Novo post"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              Publicacao SEO e comunicacao com a base
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Titulo</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                placeholder="Ex.: 7 loops de retention para arcade"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Slug opcional</label>
              <input
                type="text"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                placeholder="gerado automaticamente se vazio"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                placeholder="SEO, Monetizacao, Performance..."
              />
            </div>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isPublished: event.target.checked }))
                }
                className="rounded border-slate-700 bg-slate-950 text-cyan-300"
              />
              Publicar agora
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">Imagem de capa</label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Upload local para destaque na home, listagem e artigo.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-white">
                {uploadingCover ? "Enviando..." : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleCoverUpload(event)}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
            </div>

            {form.coverImageUrl ? (
              <div className="grid gap-3 md:grid-cols-[160px,1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <Image
                    src={form.coverImageUrl}
                    alt={form.title || "Preview da capa do post"}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.coverImageUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    placeholder="/uploads/blog-covers/..."
                  />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, coverImageUrl: "" }))}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-red-500/70 hover:text-red-200"
                  >
                    Remover capa
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={form.coverImageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                placeholder="Cole uma URL de capa ou envie uma imagem"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Resumo</label>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="Se vazio, o sistema resume a abertura do artigo."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Conteudo</label>
            <textarea
              rows={14}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              placeholder="Escreva em paragrafos e listas iniciando linhas com - para bullets."
            />
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
              className="inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-70"
            >
              {saving ? "Salvando..." : form.id ? "Atualizar post" : "Salvar post"}
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Fila editorial</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">{posts.length} post(s)</h2>
            </div>
            {loading ? <span className="text-xs text-slate-500">Carregando...</span> : null}
          </div>

          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-4">
                    {post.coverImageUrl ? (
                      <div className="relative hidden aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 sm:block">
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">{post.title}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          post.isPublished
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-700 bg-slate-950/70 text-slate-400"
                        }`}
                      >
                        {post.isPublished ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {post.category} • {post.slug} • {post.readingTime}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[12px] text-slate-400">{post.excerpt}</p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {post.isPublished
                        ? `Publicado em ${new Date(post.publishedAt).toLocaleString("pt-BR")}`
                        : `Atualizado em ${new Date(post.updatedAt).toLocaleString("pt-BR")}`}
                    </p>
                  </div>
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => editPost(post)}
                      className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(post.id)}
                      className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-slate-200 transition-colors hover:border-red-500/70 hover:text-red-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && posts.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
                Nenhum post cadastrado ainda.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}