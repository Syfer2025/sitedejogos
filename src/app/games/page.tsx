import { permanentRedirect } from "next/navigation";

import { getSingleQueryValue } from "@/lib/pagination";

type GamesPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    q?: string | string[];
  }>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = getSingleQueryValue(resolvedSearchParams.q)?.trim() ?? "";
  const category = getSingleQueryValue(resolvedSearchParams.category)?.trim() ?? "";
  const nextParams = new URLSearchParams();

  if (category) {
    nextParams.set("category", category);
  }

  if (query) {
    nextParams.set("q", query);
  }

  permanentRedirect(nextParams.size > 0 ? `/?${nextParams.toString()}#catalogo` : "/#catalogo");
}