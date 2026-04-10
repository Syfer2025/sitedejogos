import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateGameSEOContent } from "@/lib/content-generation";

// GET — returns how many games still need content
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [total, pending] = await Promise.all([
    prisma.game.count({ where: { isPublished: true } }),
    prisma.game.count({ where: { isPublished: true, longDescription: "" } }),
  ]);

  return NextResponse.json({ total, pending, filled: total - pending });
}

// POST — generates content for the next `batchSize` games (default 5)
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(Math.max(Number(body.batchSize) || 5, 1), 20);

  const games = await prisma.game.findMany({
    where: { isPublished: true, longDescription: "" },
    select: { id: true, title: true, description: true, category: true, tags: true },
    take: batchSize,
    orderBy: { views: "desc" }, // prioritize most-viewed games first
  });

  if (games.length === 0) {
    return NextResponse.json({ message: "All games already have content.", filled: 0 });
  }

  const results: { id: string; title: string; status: "ok" | "error"; error?: string }[] = [];

  for (const game of games) {
    try {
      const content = await generateGameSEOContent({
        title: game.title,
        description: game.description,
        category: game.category,
        tags: game.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      await prisma.game.update({
        where: { id: game.id },
        data: {
          longDescription: content.longDescription,
          tips: content.tips,
          controls: content.controls,
          faqJson: content.faqJson,
        },
      });

      results.push({ id: game.id, title: game.title, status: "ok" });
    } catch (err) {
      console.error(`[fill-content] Failed for game ${game.id}:`, err);
      results.push({
        id: game.id,
        title: game.title,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Small delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  const filled = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({ filled, results });
}
