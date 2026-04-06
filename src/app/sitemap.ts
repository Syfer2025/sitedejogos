import type { MetadataRoute } from "next";

import { listPublishedBlogPosts } from "@/data/blogPosts";
import { listGames } from "@/data/gamesStore";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, blogPosts] = await Promise.all([
    listGames({ publishedOnly: true }),
    listPublishedBlogPosts(),
  ]);

  const staticRoutes = ["", "/blog"];

  return [
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
  ];
}