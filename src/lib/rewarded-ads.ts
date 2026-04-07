import { prisma } from "@/lib/prisma";
import { addCoins } from "@/data/monetizationStore";

export const REWARDED_AD_CONFIG = {
  coinsPerView: 50,
  maxViewsPerDay: 10,
  cooldownMs: 60_000, // 60s between views
} as const;

function getTodayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function canClaimReward(userId: string) {
  const todayStart = getTodayStart();

  const viewsToday = await prisma.rewardedAdView.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
  });

  const lastView = await prisma.rewardedAdView.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const cooldownRemaining = lastView
    ? Math.max(0, REWARDED_AD_CONFIG.cooldownMs - (Date.now() - lastView.createdAt.getTime()))
    : 0;

  const allowed = viewsToday < REWARDED_AD_CONFIG.maxViewsPerDay && cooldownRemaining === 0;

  return {
    allowed,
    viewsToday,
    maxViews: REWARDED_AD_CONFIG.maxViewsPerDay,
    cooldownRemaining,
    reason: !allowed
      ? viewsToday >= REWARDED_AD_CONFIG.maxViewsPerDay
        ? "daily_limit"
        : "cooldown"
      : undefined,
  };
}

export async function claimAdReward(userId: string, rewardType: string = "coins") {
  const status = await canClaimReward(userId);
  if (!status.allowed) {
    return { ok: false, reason: status.reason };
  }

  const amount = REWARDED_AD_CONFIG.coinsPerView;

  await prisma.rewardedAdView.create({
    data: { userId, rewardType, rewardAmount: amount },
  });

  await addCoins(userId, amount, "rewarded_ad");

  return { ok: true, coins: amount };
}
