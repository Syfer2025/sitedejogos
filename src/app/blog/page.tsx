import { cookies } from "next/headers";

import Image from "next/image";

import { listPublishedBlogPosts } from "@/data/blogPosts";
import { getLocaleContentLocale, LOCALE_COOKIE_NAME, resolveLocale, type Locale } from "@/lib/locale";

import { AdSlot } from "../components/AdSlot";
import { BlogImpressionTracker } from "../components/BlogAnalyticsTrackers";
import { TrackedLink } from "../components/TrackedLink";

function getBlogTexts(locale: Locale) {
  const contentLocale = getLocaleContentLocale(locale);

  if (contentLocale === "en") {
    return {
      kicker: "Arcade Nexus Blog",
      title: "Content to grow your HTML5 gaming portal.",
      subtitle:
        "Articles focused on SEO, monetization and performance tactics to scale organic traffic and revenue.",
      readArticle: "Read full article ↗",
      topBanner: "Top banner - Blog",
      bottomBanner: "Bottom banner - Blog",
      publishedAt: "Published",
      readingTime: "Read time",
    } as const;
  }

  if (contentLocale === "es") {
    return {
      kicker: "Blog Arcade Nexus",
      title: "Contenido para hacer crecer tu portal HTML5.",
      subtitle:
        "Artículos enfocados en SEO, monetización y performance para escalar tráfico orgánico e ingresos.",
      readArticle: "Leer artículo completo ↗",
      topBanner: "Banner superior - Blog",
      bottomBanner: "Banner inferior - Blog",
      publishedAt: "Publicado",
      readingTime: "Lectura",
    } as const;
  }

  return {
    kicker: "Blog Arcade Nexus",
    title: "Conteúdo para crescer seu portal HTML5.",
    subtitle:
      "Artigos focados em SEO, monetização e performance para escalar tráfego orgânico e receita.",
    readArticle: "Ler artigo completo ↗",
    topBanner: "Banner superior - Blog",
    bottomBanner: "Banner inferior - Blog",
    publishedAt: "Publicado em",
    readingTime: "Leitura",
  } as const;
}

export default async function BlogPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const posts = await listPublishedBlogPosts();
  const t = getBlogTexts(locale);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:py-10">
      <AdSlot
        label={t.topBanner}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_TOP}
      />

      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {t.kicker}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
          {t.title}
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">{t.subtitle}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col justify-between rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 transition-colors hover:border-cyan-400/60 hover:bg-slate-900/80"
          >
            <BlogImpressionTracker
              sourcePath="/blog"
              destinationPath={`/blog/${post.slug}`}
            />
            <TrackedLink
              href={`/blog/${post.slug}`}
              trackingPath="/blog"
              trackingEventType="blog_click"
              className="group block h-full"
            >
              <div className="space-y-3">
                {post.coverImageUrl ? (
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] border border-slate-800 bg-slate-950">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                  <span className="rounded-full border border-slate-700/80 bg-slate-900/70 px-2 py-0.5 text-slate-300">
                    {post.category}
                  </span>
                  <span>{t.publishedAt}: {new Date(post.publishedAt).toLocaleDateString(locale)}</span>
                  <span>{t.readingTime}: {post.readingTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-50 transition-colors group-hover:text-white">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400">{post.excerpt}</p>
              </div>

              <div className="mt-4 text-sm text-cyan-300 transition-colors group-hover:text-cyan-200">
                {t.readArticle}
              </div>
            </TrackedLink>
          </article>
        ))}
      </section>

      <AdSlot
        label={t.bottomBanner}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_BOTTOM}
      />
    </div>
  );
}