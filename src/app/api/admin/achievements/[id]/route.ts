import { NextRequest, NextResponse } from "next/server";

import {
  deleteAchievementDefinition,
  updateAchievementDefinition,
} from "@/data/achievementDefinitionsStore";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { updateAchievementDefinitionInputSchema } from "@/lib/achievement-schema";
import { consumeRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-achievements-write:${session.id}`, {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateAchievementDefinitionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const definition = await updateAchievementDefinition(id, parsed.data);

  if (!definition) {
    return NextResponse.json({ error: "Conquista não encontrada." }, { status: 404 });
  }

  return NextResponse.json(definition);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-achievements-write:${session.id}`, {
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const definition = await deleteAchievementDefinition(id);

  if (!definition) {
    return NextResponse.json({ error: "Conquista não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
