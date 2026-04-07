import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { addCoins } from "@/data/monetizationStore";
import { prisma } from "@/lib/prisma";
import { getAvatarPresetById } from "@/data/avatarPresets";
import { getCoverPresetById } from "@/data/coverPresets";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await getPlayerSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemId, itemType } = body as { itemId: string; itemType: "avatar" | "cover" };

    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Missing itemId or itemType" }, { status: 400 });
    }

    // Verify item exists and get price
    let price = 0;
    let isPremium = false;

    if (itemType === "avatar") {
      const preset = getAvatarPresetById(itemId);
      if (!preset) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      isPremium = preset.isPremium ?? false;
      price = preset.price ?? 0;
    } else if (itemType === "cover") {
      const preset = getCoverPresetById(itemId);
      if (!preset) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      isPremium = preset.isPremium ?? false;
      price = preset.price ?? 0;
    }

    if (!isPremium) {
      return NextResponse.json({ error: "Item is not premium" }, { status: 400 });
    }

    // Check if user already owns it
    // @ts-ignore - Prisma IDE sync lag
    const userRow = await (prisma.playerUser as any).findUnique({
      where: { id: session.user.id },
      select: { coins: true, unlockedAvatars: true, unlockedCovers: true },
    });

    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const unlockedArr = itemType === "avatar" 
        ? userRow.unlockedAvatars.split(",").filter(Boolean)
        : userRow.unlockedCovers.split(",").filter(Boolean);

    if (unlockedArr.includes(itemId)) {
      return NextResponse.json({ error: "Already owned" }, { status: 400 });
    }

    // Check balance
    if (userRow.coins < price) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }

    // Deduct coins (transaction)
    await addCoins(session.user.id, -price, `store_purchase_${itemType}_${itemId}`);

    // Append to unlocked items
    unlockedArr.push(itemId);
    const newUnlockedString = unlockedArr.join(",");

    // @ts-ignore - Prisma IDE sync lag
    await (prisma.playerUser as any).update({
      where: { id: session.user.id },
      data: itemType === "avatar" 
        ? { unlockedAvatars: newUnlockedString }
        : { unlockedCovers: newUnlockedString }
    });

    return NextResponse.json({ success: true, newBalance: userRow.coins - price });

  } catch (error) {
    console.error("[Store Purchase Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
