import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateCategorySEOContent } from "@/lib/content-generation";

// GET — list all categories with content status
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [categoryGroups, existing] = await Promise.all([
    prisma.game.groupBy({
      by: ["category"],
      where: { isPublished: true, category: { not: "" } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.categoryContent.findMany({ select: { category: true, updatedAt: true } }),
  ]);

  const existingMap = new Map(existing.map((e) => [e.category, e.updatedAt]));

  return NextResponse.json(
    categoryGroups.map((g) => ({
      category: g.category,
      gameCount: g._count._all,
      hasContent: existingMap.has(g.category),
      updatedAt: existingMap.get(g.category) ?? null,
    })),
  );
}

// POST — generate content for one or all categories
// body: { category?: string } — omit to generate all missing
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetCategory: string | undefined = body.category;

  // Determine which categories to process
  let toProcess: string[];

  if (targetCategory) {
    toProcess = [targetCategory];
  } else {
    // Generate only categories that don't have content yet
    const [allCategories, existing] = await Promise.all([
      prisma.game.findMany({
        where: { isPublished: true, category: { not: "" } },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.categoryContent.findMany({ select: { category: true } }),
    ]);
    const existingSet = new Set(existing.map((e) => e.category));
    toProcess = allCategories
      .map((c) => c.category)
      .filter((c) => !existingSet.has(c));
  }

  const results: { category: string; status: "ok" | "error"; error?: string }[] = [];

  for (const category of toProcess) {
    try {
      // Fetch top game titles for this category
      const topGames = await prisma.game.findMany({
        where: { isPublished: true, category },
        orderBy: [{ views: "desc" }, { popularityScore: "desc" }],
        select: { title: true },
        take: 15,
      });

      const content = await generateCategorySEOContent(
        category,
        topGames.map((g) => g.title),
      );

      await prisma.categoryContent.upsert({
        where: { category },
        create: { category, ...content },
        update: { ...content },
      });

      results.push({ category, status: "ok" });
    } catch (err) {
      console.error(`[category-content] Failed for "${category}":`, err);
      results.push({
        category,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Avoid rate limits between categories
    await new Promise((r) => setTimeout(r, 500));
  }

  const generated = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({ generated, results });
}
