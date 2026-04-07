import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { isPlayerPremium } from "@/data/monetizationStore";

import { HomeRightSidebar } from "../../components/HomeRightSidebar";
import { AntiAdBlockGuard } from "../../components/AntiAdBlockGuard";
import { InterstitialProvider } from "../../components/InterstitialManager";

export default async function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const premium = playerSession ? await isPlayerPremium(playerSession.user.id) : false;

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <main className="relative z-[1] flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        <AntiAdBlockGuard />
        <InterstitialProvider isPremium={premium}>
          {children}
        </InterstitialProvider>
      </main>
      <HomeRightSidebar />
    </div>
  );
}
