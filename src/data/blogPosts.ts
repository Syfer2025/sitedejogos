import { prisma } from "@/lib/prisma";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "@/lib/blog-schema";
import { slugify } from "@/lib/game-schema";

export type BlogPostRecord = {
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

const DEFAULT_BLOG_POSTS: Array<
  Omit<BlogPostRecord, "id" | "createdAt" | "updatedAt" | "isPublished"> & {
    isPublished?: boolean;
  }
> = [
  {
    slug: "como-monetizar-portal-de-jogos-html5",
    title: "Como monetizar um portal de jogos HTML5 com anúncios",
    coverImageUrl: "",
    excerpt:
      "Entenda os principais formatos de anúncio, posições estratégicas e boas práticas para aumentar o RPM sem prejudicar a experiência do jogador.",
    category: "Monetização",
    readingTime: "4 min",
    publishedAt: "2026-04-05T12:00:00.000Z",
    content: `Monetizar um portal de jogos HTML5 vai muito além de simplesmente colar códigos de anúncio em qualquer lugar da página.

Para maximizar receita sem destruir a experiência do jogador, você precisa pensar em:

- Posicionamento estratégico de banners acima da dobra, dentro da página de jogo e em meio ao conteúdo do blog.
- Equilíbrio entre anúncios e conteúdo: excesso de ads derruba retenção e reduz o número de impressões por usuário.
- Velocidade: páginas rápidas carregam mais anúncios vistos e melhoram o rankeamento no Google.

No Gasty Games, a home, as páginas de jogo e o blog foram desenhados com espaços de mídia claros, sem sacrificar legibilidade ou desempenho.`,
    isPublished: true,
  },
  {
    slug: "seo-para-sites-de-jogos-online",
    title: "Guia rápido de SEO para sites de jogos online",
    coverImageUrl: "",
    excerpt:
      "Veja como estruturar URLs, títulos, descrições e conteúdo para atrair tráfego orgânico qualificado para o seu portal de jogos.",
    category: "SEO",
    readingTime: "5 min",
    publishedAt: "2026-04-05T12:10:00.000Z",
    content: `Um bom SEO para sites de jogos online começa pela estrutura.

Alguns pontos-chave:

- URLs limpas com slugs amigáveis para cada jogo e artigo.
- Títulos e descrições otimizados usando termos como jogos online, jogos HTML5 e categorias específicas.
- Conteúdo de apoio via blog, explicando mecânicas, listas de jogos e comparativos.

Este portal já traz uma arquitetura preparada para SEO: páginas por slug, seção de blog, categorias indexáveis e layout responsivo otimizado para Core Web Vitals.`,
    isPublished: true,
  },
  {
    slug: "vantagens-dos-jogos-html5-no-navegador",
    title: "Por que jogos HTML5 carregam mais rápido no navegador",
    coverImageUrl: "",
    excerpt:
      "Descubra as vantagens técnicas do HTML5 para jogos em browser e como isso impacta retenção, pageviews e faturamento com anúncios.",
    category: "Performance",
    readingTime: "3 min",
    publishedAt: "2026-04-05T12:20:00.000Z",
    content: `Jogos HTML5 rodam direto no navegador, sem necessidade de plugins ou instalações pesadas.

Isso traz vantagens importantes:

- Menos atrito: o jogador clica e já está jogando, aumentando a taxa de engajamento.
- Melhor compatibilidade: funciona em desktop, tablet e mobile modernos.
- Benefício para SEO: páginas leves e rápidas têm mais chances de ranquear bem.

Ao combinar HTML5 com uma boa estratégia de cache, CDN e otimização de imagens, seu portal consegue oferecer uma experiência fluida mesmo com alto volume de acessos.`,
    isPublished: true,
  },
];

function mapBlogPost(post: {
  id: string;
  slug: string;
  title: string;
  category: string;
  coverImageUrl: string;
  excerpt: string;
  content: string;
  readingTime: string;
  publishedAt: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BlogPostRecord {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    coverImageUrl: post.coverImageUrl,
    excerpt: post.excerpt,
    content: post.content,
    readingTime: post.readingTime,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    isPublished: post.isPublished,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function buildExcerpt(input: { excerpt?: string; content: string }) {
  const explicitExcerpt = input.excerpt?.trim();

  if (explicitExcerpt) {
    return explicitExcerpt;
  }

  const collapsedContent = input.content.replace(/\s+/g, " ").trim();
  if (collapsedContent.length <= 180) {
    return collapsedContent;
  }

  return `${collapsedContent.slice(0, 177).trim()}...`;
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min`;
}

function resolveBlogSlug(input: Pick<CreateBlogPostInput, "slug" | "title">) {
  if (input.slug?.trim()) {
    return slugify(input.slug.trim());
  }

  return slugify(input.title.trim());
}

async function makeUniqueBlogSlug(
  input: Pick<CreateBlogPostInput, "slug" | "title">,
  currentId?: string,
) {
  const baseSlug = resolveBlogSlug(input) || "post";
  let nextSlug = baseSlug;
  let counter = 1;

  while (
    await prisma.blogPost.findFirst({
      where: {
        slug: nextSlug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    })
  ) {
    nextSlug = `${baseSlug}-${counter++}`;
  }

  return nextSlug;
}

async function notifyPlayersAboutBlogPublication(post: BlogPostRecord) {
  const existingNotifications = await prisma.playerNotification.findMany({
    where: {
      kind: "blog_post",
      link: `/blog/${post.slug}`,
    },
    select: {
      userId: true,
    },
  });

  const notifiedUsers = new Set(existingNotifications.map((notification) => notification.userId));
  const players = await prisma.user.findMany({
    select: { id: true },
  });

  const notifications = players
    .filter((player) => !notifiedUsers.has(player.id))
    .map((player) => ({
      userId: player.id,
      kind: "blog_post",
      title: `Novo no blog: ${post.title}`,
      message: post.excerpt,
      link: `/blog/${post.slug}?ref=notification`,
      createdAt: new Date(post.publishedAt),
    }));

  if (notifications.length === 0) {
    return;
  }

  await prisma.playerNotification.createMany({
    data: notifications,
  });
}

export async function ensureDefaultBlogPosts() {
  const existing = await prisma.blogPost.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((post) => post.slug));
  const missingPosts = DEFAULT_BLOG_POSTS.filter((post) => !existingSlugs.has(post.slug));

  if (missingPosts.length === 0) {
    return;
  }

  await prisma.blogPost.createMany({
    data: missingPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      category: post.category,
      coverImageUrl: post.coverImageUrl,
      excerpt: post.excerpt,
      content: post.content,
      readingTime: post.readingTime,
      isPublished: post.isPublished ?? true,
      publishedAt: new Date(post.publishedAt),
    })),
  });
}

export async function listPublishedBlogPosts(limit?: number) {
  await ensureDefaultBlogPosts();

  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  });

  return posts.map(mapBlogPost);
}

export async function listAdminBlogPosts() {
  await ensureDefaultBlogPosts();

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ isPublished: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map(mapBlogPost);
}

export async function getAllBlogPosts() {
  return listPublishedBlogPosts();
}

export async function getBlogPostBySlug(slug: string, includeDrafts = false) {
  await ensureDefaultBlogPosts();

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) {
    return null;
  }

  if (!includeDrafts && !post.isPublished) {
    return null;
  }

  return mapBlogPost(post);
}

export async function createBlogPost(input: CreateBlogPostInput) {
  await ensureDefaultBlogPosts();
  const slug = await makeUniqueBlogSlug(input);
  const isPublished = input.isPublished;
  const publishedAt = isPublished ? new Date() : null;

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: input.title.trim(),
      category: input.category.trim(),
      coverImageUrl: input.coverImageUrl?.trim() ?? "",
      excerpt: buildExcerpt(input),
      content: input.content.trim(),
      readingTime: estimateReadingTime(input.content),
      isPublished,
      publishedAt,
    },
  });

  const mapped = mapBlogPost(post);

  if (mapped.isPublished) {
    await notifyPlayersAboutBlogPublication(mapped);
  }

  return mapped;
}

export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  await ensureDefaultBlogPosts();

  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const nextSlug =
    input.slug !== undefined || input.title !== undefined
      ? await makeUniqueBlogSlug(
          {
            slug: input.slug,
            title: input.title ?? existing.title,
          },
          id,
        )
      : undefined;
  const nextIsPublished = input.isPublished ?? existing.isPublished;
  const isPublishingNow = !existing.isPublished && nextIsPublished;
  const nextContent = input.content?.trim() ?? existing.content;
  const nextExcerpt =
    input.excerpt !== undefined || input.content !== undefined
      ? buildExcerpt({
          excerpt: input.excerpt,
          content: nextContent,
        })
      : existing.excerpt;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl.trim() } : {}),
      ...(input.excerpt !== undefined || input.content !== undefined ? { excerpt: nextExcerpt } : {}),
      ...(input.content !== undefined
        ? {
            content: nextContent,
            readingTime: estimateReadingTime(nextContent),
          }
        : {}),
      ...(input.isPublished !== undefined
        ? {
            isPublished: nextIsPublished,
            publishedAt: nextIsPublished ? existing.publishedAt ?? new Date() : null,
          }
        : {}),
    },
  });

  const mapped = mapBlogPost(post);

  if (isPublishingNow) {
    await notifyPlayersAboutBlogPublication(mapped);
  }

  return mapped;
}

export async function deleteBlogPost(id: string) {
  await ensureDefaultBlogPosts();

  try {
    const post = await prisma.blogPost.delete({
      where: { id },
    });

    return mapBlogPost(post);
  } catch {
    return null;
  }
}