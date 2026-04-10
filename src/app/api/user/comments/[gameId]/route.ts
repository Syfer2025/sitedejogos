import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createComment, listGameComments } from "@/data/socialStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ gameId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { gameId } = await context.params;
  const comments = await listGameComments(gameId);
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit(`comment:${session.userId}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitos comentários em sequência." },
      { status: 429 },
    );
  }

  const { gameId } = await context.params;
  const body = await req.json().catch(() => null);
  const raw = typeof body?.content === "string" ? body.content.trim() : "";

  if (!raw) {
    return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });
  }
  if (raw.length > 500) {
    return NextResponse.json({ error: "Comentário muito longo (máx. 500 caracteres)." }, { status: 400 });
  }

  const content = raw;

  try {
    const comment = await createComment(gameId, session.userId, content);
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao comentar." },
      { status: 400 },
    );
  }
}
