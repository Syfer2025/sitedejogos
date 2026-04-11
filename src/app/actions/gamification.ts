"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PLAYER_SESSION_COOKIE, getPlayerSession } from "@/lib/user-auth";
import { markAllPlayerNotificationsAsRead } from "@/data/gamificationStore";

export async function markNotificationsAsRead() {
  const cookieStore = await cookies();
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;

  if (playerToken) {
    const session = await getPlayerSession(playerToken);
    if (session) {
      await markAllPlayerNotificationsAsRead(session.user.id);
    }
  }

  revalidatePath("/");
}
