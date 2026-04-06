import { NextRequest, NextResponse } from "next/server";

import { listCategoryShowcasesPage } from "@/data/gamesStore";

function parseInteger(value: string | null, fallbackValue: number) {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const offset = Math.max(parseInteger(searchParams.get("offset"), 0), 0);
  const limit = Math.min(Math.max(parseInteger(searchParams.get("limit"), 3), 1), 8);
  const gamesPerCategory = Math.min(
    Math.max(parseInteger(searchParams.get("gamesPerCategory"), 14), 1),
    18,
  );
  const sortBy = searchParams.get("sort") === "newest" ? "newest" : "popular";

  const result = await listCategoryShowcasesPage({
    offset,
    limit,
    gamesPerCategory,
    sortBy,
    categoryOrder: "editorial",
  });

  return NextResponse.json(result);
}