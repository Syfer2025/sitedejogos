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
  const cookieStore = await import("next/headers").then(m => m.cookies());
  const sortBy = searchParams.get("sort") === "newest" ? "newest" : "popular";
  const { PLAYER_SESSION_COOKIE, getPlayerSession } = await import("@/lib/user-auth");
  const token = (await cookieStore).get(PLAYER_SESSION_COOKIE)?.value;

  let currentUserId: string | undefined;
  
  if (token) {
    const session = await getPlayerSession(token);
    if (session) currentUserId = session.user.id;
  }

  const result = await listCategoryShowcasesPage({
    offset,
    limit,
    gamesPerCategory,
    sortBy,
    categoryOrder: "editorial",
    currentUserId,
  });

  return NextResponse.json(result);
}