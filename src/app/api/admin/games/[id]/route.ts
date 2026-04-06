import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { updateGameInputSchema } from "@/lib/game-schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getGameById, updateGame, deleteGame } from "@/data/gamesStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-write:${session.id}`, {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const parsed = updateGameInputSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
        { status: 400 }
      );
    }

    const updated = await updateGame(id, parsed.data);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar jogo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-write:${session.id}`, {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 }
    );
  }

  const { id } = await params;
  const deleted = await deleteGame(id);
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
