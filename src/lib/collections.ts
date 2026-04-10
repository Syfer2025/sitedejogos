import type { Prisma } from "@prisma/client";

export type CollectionConfig = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  emoji: string;
  where: Prisma.GameWhereInput;
};

// Editorial collections — tag/category-based queries
// Add new ones here; they auto-appear in sitemap and nav.
export const COLLECTIONS: CollectionConfig[] = [
  {
    slug: "two-player-games",
    title: "2 Player Games Online Free",
    h1: "2 Player Games",
    description: "The best two-player browser games to play with a friend on the same screen — no download needed.",
    emoji: "👥",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "2 player" } },
        { tags: { contains: "2player" } },
        { tags: { contains: "multiplayer" } },
        { tags: { contains: "two player" } },
      ],
    },
  },
  {
    slug: "horror-games",
    title: "Horror Games Online Free",
    h1: "Horror Games",
    description: "Scary browser games that will keep you on the edge of your seat. Play free horror games online.",
    emoji: "👻",
    where: {
      isPublished: true,
      OR: [
        { category: { contains: "Horror", mode: "insensitive" as any } },
        { tags: { contains: "horror" } },
        { tags: { contains: "scary" } },
      ],
    },
  },
  {
    slug: "car-games",
    title: "Car Games Online Free",
    h1: "Car Games",
    description: "Drive, race and drift in the best free car games online. No download required — play in browser.",
    emoji: "🚗",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "car" } },
        { tags: { contains: "cars" } },
        { tags: { contains: "driving" } },
        { tags: { contains: "vehicle" } },
        { category: { contains: "Racing", mode: "insensitive" as any } },
      ],
    },
  },
  {
    slug: "shooting-games",
    title: "Shooting Games Online Free",
    h1: "Shooting Games",
    description: "The best free online shooting games — FPS, top-down shooters, and more. Play instantly in browser.",
    emoji: "🎯",
    where: {
      isPublished: true,
      OR: [
        { category: { contains: "Shooting", mode: "insensitive" as any } },
        { tags: { contains: "shooting" } },
        { tags: { contains: "shooter" } },
        { tags: { contains: "fps" } },
      ],
    },
  },
  {
    slug: "idle-games",
    title: "Idle & Clicker Games Online Free",
    h1: "Idle & Clicker Games",
    description: "Relaxing idle and clicker games you can play for free in your browser. Perfect for casual gaming.",
    emoji: "🖱️",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "idle" } },
        { tags: { contains: "clicker" } },
        { tags: { contains: "incremental" } },
        { tags: { contains: "tycoon" } },
      ],
    },
  },
  {
    slug: "zombie-games",
    title: "Zombie Games Online Free",
    h1: "Zombie Games",
    description: "Survive the apocalypse in the best free zombie games online. No install, just play.",
    emoji: "🧟",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "zombie" } },
        { tags: { contains: "zombies" } },
        { tags: { contains: "undead" } },
      ],
    },
  },
  {
    slug: "running-games",
    title: "Running Games Online Free",
    h1: "Running Games",
    description: "Endless runners and parkour games you can play for free in your browser. No download needed.",
    emoji: "🏃",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "runner" } },
        { tags: { contains: "running" } },
        { tags: { contains: "endless runner" } },
        { tags: { contains: "parkour" } },
      ],
    },
  },
  {
    slug: "games-for-kids",
    title: "Games for Kids Online Free",
    h1: "Games for Kids",
    description: "Safe and fun free browser games for kids. Educational, colorful and 100% free to play.",
    emoji: "🧒",
    where: {
      isPublished: true,
      OR: [
        { tags: { contains: "kids" } },
        { tags: { contains: "children" } },
        { tags: { contains: "family" } },
        { tags: { contains: "educational" } },
        { category: { contains: "Kids", mode: "insensitive" as any } },
      ],
    },
  },
];

export function getCollection(slug: string): CollectionConfig | null {
  return COLLECTIONS.find((c) => c.slug === slug) ?? null;
}
