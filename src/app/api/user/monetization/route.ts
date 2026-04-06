import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getPlayerMonetizationProfile,
  listCoinHistory,
  unlockTheme,
  PROFILE_THEMES,
} from "@/data/monetizationStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, history] = await Promise.all([
    getPlayerMonetizationProfile(session.userId),
    listCoinHistory(session.userId),
  ]);

  return NextResponse.json({
    profile,
    history,
    themes: PROFILE_THEMES,
  });
}

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "unlock_theme") {
    const themeId = typeof body?.themeId === "string" ? body.themeId : "";
    try {
      const theme = await unlockTheme(session.userId, themeId);
      return NextResponse.json({ ok: true, theme });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro ao desbloquear tema." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
