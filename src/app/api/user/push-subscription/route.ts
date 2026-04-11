import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

// POST — save or update push subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const { endpoint, keys } = body ?? {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Subscription inválida." }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: session.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: session.userId, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push-subscription] POST error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// DELETE — remove push subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const { endpoint } = body ?? {};
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { userId: session.userId, endpoint } });
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId: session.userId } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push-subscription] DELETE error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
