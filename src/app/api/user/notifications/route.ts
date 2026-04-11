import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

// GET — returns recent notifications + unread count
export async function GET(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.playerNotification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, kind: true, title: true, message: true, link: true, isRead: true, createdAt: true },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[notifications] GET error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// PATCH — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getPlayerSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.playerNotification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications] PATCH error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
