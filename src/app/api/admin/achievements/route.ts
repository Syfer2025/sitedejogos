import { NextRequest, NextResponse } from "next/server";

import {
  createAchievementDefinition,
  listAchievementDefinitions,
} from "@/data/achievementDefinitionsStore";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { createAchievementDefinitionInputSchema } from "@/lib/achievement-schema";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const definitions = await listAchievementDefinitions({ includeInactive });

  return NextResponse.json(definitions);
}

export async function POST(req: NextRequest) {
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
  const parsed = createAchievementDefinitionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  try {
    const definition = await createAchievementDefinition(parsed.data);
    return NextResponse.json(definition, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar a conquista agora." },
      { status: 500 },
    );
  }
}
