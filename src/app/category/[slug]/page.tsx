import { permanentRedirect } from "next/navigation";

import { listCategories } from "@/data/gamesStore";
import { slugify } from "@/lib/game-schema";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

async function findCategory(slug: string) {
  const categories = await listCategories({ order: "editorial" });
  return categories.find((entry) => slugify(entry) === slug) ?? null;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await findCategory(slug);

  permanentRedirect(category ? `/?category=${encodeURIComponent(category)}#catalogo` : "/#catalogo");
}