import { NextRequest, NextResponse } from "next/server";

import { listGames, listGamesPage } from "@/data/gamesStore";
import { resolvePagination } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const filters = {
    category: searchParams.get("category") || undefined,
    query: searchParams.get("q") || undefined,
    featured:
      searchParams.get("featured") === "true"
        ? true
        : searchParams.get("featured") === "false"
        ? false
        : undefined,
    publishedOnly: true,
    sortBy: searchParams.get("sort") === "popular" ? "popular" : "newest",
  } as const;

  if (searchParams.has("page") || searchParams.has("pageSize")) {
    const { page, pageSize } = resolvePagination({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      defaultPageSize: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 12,
    });

    const result = await listGamesPage({
      ...filters,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  }

  const games = await listGames({
    ...filters,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });

  return NextResponse.json(games);
}
