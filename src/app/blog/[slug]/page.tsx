import type { Metadata } from "next";

import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getBlogPostBySlug } from "@/data/blogPosts";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";

import { AdSlot } from "../../components/AdSlot";
import { BlogViewTracker } from "../../components/BlogAnalyticsTrackers";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Artigo não encontrado",
      description: "Este conteúdo não está disponível no momento.",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:py-10">
      <AdSlot
        label="Banner superior - Artigo"
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP}
      />

      <article className="space-y-5">
        <BlogViewTracker path={`/blog/${post.slug}`} />
        <header className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
            <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-slate-300">
              {post.category}
            </span>
            <span>{new Date(post.publishedAt).toLocaleDateString(locale)}</span>
            <span>{post.readingTime}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            {post.title}
          </h1>
          <p className="text-sm text-slate-400">{post.excerpt}</p>
        </header>

        {post.coverImageUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-50 prose-p:text-slate-200 prose-li:text-slate-200">
          {post.content.split("\n\n").map((block) => {
            const key = `${post.id}-${block.slice(0, 24)}`;
            const isList = block.startsWith("-");

            if (isList) {
              return (
                <ul key={key}>
                  {block.split("\n").map((item) => (
                    <li key={`${key}-${item}`}>{item.replace(/^-\s*/, "")}</li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={key} className="whitespace-pre-wrap">
                {block}
              </p>
            );
          })}
        </div>
      </article>

      <AdSlot
        label="Banner inferior - Artigo"
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM}
      />
    </div>
  );
}