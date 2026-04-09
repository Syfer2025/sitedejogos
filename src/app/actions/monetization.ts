"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { applyGamificationEvent } from "@/data/gamificationStore";
import { addCoins } from "@/data/monetizationStore";

export async function claimRewardedAdReward() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const session = sessionToken ? await getPlayerSession(sessionToken) : null;

  if (!session) {
    return { success: false, error: "Não autorizado." };
  }

  try {
    const coinReward = 50;

    // Concede XP e atualiza progresso de missão relacionados a view_ad
    await applyGamificationEvent(session.user.id, "ad_reward_view");

    // Adiciona moedas manual e isoladamente por assistir ao anúncio premio
    await addCoins(session.user.id, coinReward, "rewarded_ad_claim");

    revalidatePath("/account");
    revalidatePath("/");

    return { 
      success: true, 
      coinsGranted: coinReward,
    };
  } catch (error) {
    console.error("Failed to claim rewarded ad:", error);
    return { success: false, error: "Falha ao processar a recompensa." };
  }
}
