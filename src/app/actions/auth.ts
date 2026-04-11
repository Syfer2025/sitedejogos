"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLAYER_SESSION_COOKIE } from "@/lib/user-auth";

export async function logoutPlayer() {
  const cookieStore = await cookies();
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;

  if (playerToken) {
    const { deletePlayerSession } = await import("@/lib/user-auth");
    await deletePlayerSession(playerToken);
  }

  cookieStore.set(PLAYER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  redirect("/");
}
