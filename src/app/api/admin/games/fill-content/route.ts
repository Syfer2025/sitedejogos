import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { buildGameContent } from "@/lib/content-templates";

// GET — returns how many games still need content
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [total, pending] = await Promise.all([
      prisma.game.count({ where: { isPublished: true } }),
      prisma.game.count({ where: { isPublished: true, longDescription: "" } }),
    ]);

    return NextResponse.json({ total, pending, filled: total - pending });
  } catch (err) {
    console.error("[fill-content] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno." },
      { status: 500 },
    );
  }
}

// POST — fills content for games with empty longDescription.
// body: { all: true } fills every game at once (no batch limit).
// body: { batchSize: N } fills next N games (default 50, max 500).
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fillAll = body.all === true;
    const batchSize = fillAll ? 10_000 : Math.min(Math.max(Number(body.batchSize) || 50, 1), 500);

    const games = await prisma.game.findMany({
      where: { isPublished: true, longDescription: "" },
      select: { id: true, title: true, description: true, category: true, tags: true },
      take: batchSize,
      orderBy: { views: "desc" },
    });

    if (games.length === 0) {
      return NextResponse.json({ message: "All games already have content.", filled: 0 });
    }

    // Build all content objects in memory (pure JS, instant)
    const updates = games.map((game) => ({
      id: game.id,
      content: buildGameContent({
        title: game.title,
        description: game.description,
        category: game.category,
        tags: game.tags,
      }),
    }));

    // Process in chunks of 20 to avoid exhausting the DB connection pool
    const CHUNK_SIZE = 20;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(({ id, content }) =>
          prisma.game.update({
            where: { id },
            data: {
              longDescription: content.longDescription,
              tips: content.tips,
              controls: content.controls,
              faqJson: content.faqJson,
            },
          }),
        ),
      );
    }

    return NextResponse.json({
      filled: updates.length,
      message: `Filled ${updates.length} games.`,
    });
  } catch (err) {
    console.error("[fill-content] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno ao preencher conteúdo." },
      { status: 500 },
    );
  }
}
