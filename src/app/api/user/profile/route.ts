import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listCategories } from "@/data/gamesStore";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { getPlayerProfile, updatePlayerProfile } from "@/data/playerStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { playerProfileUpdateSchema } from "@/lib/user-schema";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getPlayerProfile(session.userId);

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = playerProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const currentProfile = await getPlayerProfile(session.userId);

  if (!currentProfile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const updateInput = {
    ...parsed.data,
  };

  if (updateInput.preferredCategories !== undefined) {
    const availableCategories = new Set(await listCategories());
    updateInput.preferredCategories = updateInput.preferredCategories.filter(
      (category) => availableCategories.has(category),
    );
  }

  if (Object.values(updateInput).every((value) => value === undefined)) {
    return NextResponse.json(
      { error: "Informe ao menos um campo para atualizar." },
      { status: 400 },
    );
  }

  const isEffectivelySame =
    (updateInput.displayName === undefined ||
      updateInput.displayName === currentProfile.displayName) &&
    (updateInput.avatarUrl === undefined ||
      updateInput.avatarUrl === currentProfile.avatarUrl) &&
    (updateInput.bio === undefined || updateInput.bio === currentProfile.bio) &&
    (updateInput.preferredCategories === undefined ||
      JSON.stringify(updateInput.preferredCategories) ===
        JSON.stringify(currentProfile.preferredCategories));

  if (isEffectivelySame) {
    return NextResponse.json(currentProfile);
  }

  const profile = await updatePlayerProfile(session.userId, updateInput);

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  await applyGamificationEvent(session.userId, "profile_update");

  return NextResponse.json(profile);
}