import type { MetadataRoute } from "next";

import { listPublishedBlogPosts } from "@/data/blogPosts";
import { listGames, listCategories } from "@/data/gamesStore";
import { slugify } from "@/lib/game-schema";
import { SUPPORTED_LOCALES } from "@/lib/locale";
import { SITE_CONFIG } from "@/lib/config";

const SITE_URL = SITE_CONFIG.url;

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, blogPosts, categories] = await Promise.all([
    listGames({ publishedOnly: true }),
    listPublishedBlogPosts(),
    listCategories({ order: "editorial" }),
  ]);

  const staticRoutes = ["", "/blog"];

  // Base routes (canonical)
  const canonicalRoutes: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...games.map((game) => ({
      url: `${SITE_URL}/games/${game.slug}`,
      lastModified: new Date(game.updatedAt),
      changeFrequency: "daily" as const,
      priority: game.featured ? 0.9 : 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/category/${slugify(category)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  // Localized routes for Home and Categories (FODIDO SEO)
  const localizedRoutes: MetadataRoute.Sitemap = [];
  
  SUPPORTED_LOCALES.forEach((locale) => {
    // Localized Home
    localizedRoutes.push({
      url: `${SITE_URL}?lang=${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    });

    // Localized Categories
    categories.forEach((category) => {
      localizedRoutes.push({
        url: `${SITE_URL}/category/${slugify(category)}?lang=${locale}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    });
  });

  return [...canonicalRoutes, ...localizedRoutes];
}