import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  findPlayerByEmail,
  listFriends,
  listPendingRequests,
  sendFriendRequest,
} from "@/data/socialStore";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [friends, pendingRequests] = await Promise.all([
    listFriends(session.userId),
    listPendingRequests(session.userId),
  ]);

  return NextResponse.json({ friends, pendingRequests });
}

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit(`friend-request:${session.userId}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json(
      { error: "Informe o e-mail do amigo." },
      { status: 400 },
    );
  }

  const target = await findPlayerByEmail(email);
  if (!target) {
    return NextResponse.json(
      { error: "Jogador não encontrado." },
      { status: 404 },
    );
  }

  try {
    await sendFriendRequest(session.userId, target.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao enviar solicitação." },
      { status: 400 },
    );
  }
}
