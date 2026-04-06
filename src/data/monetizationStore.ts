import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────
// Profile Themes
// ──────────────────────────────────────────

export type ProfileTheme = {
  id: string;
  label: string;
  gradient: string;
  borderColor: string;
  cost: number; // 0 = free
  premiumOnly: boolean;
};

export const PROFILE_THEMES: ProfileTheme[] = [
  { id: "default", label: "Padrão", gradient: "from-purple-500 via-fuchsia-500 to-cyan-400", borderColor: "border-purple-500/40", cost: 0, premiumOnly: false },
  { id: "ocean", label: "Oceano", gradient: "from-blue-500 via-cyan-400 to-teal-400", borderColor: "border-cyan-400/40", cost: 50, premiumOnly: false },
  { id: "sunset", label: "Pôr do Sol", gradient: "from-orange-500 via-rose-500 to-pink-500", borderColor: "border-orange-400/40", cost: 50, premiumOnly: false },
  { id: "forest", label: "Floresta", gradient: "from-emerald-500 via-green-500 to-lime-400", borderColor: "border-emerald-400/40", cost: 75, premiumOnly: false },
  { id: "neon", label: "Neon", gradient: "from-pink-500 via-purple-500 to-indigo-500", borderColor: "border-pink-400/40", cost: 100, premiumOnly: false },
  { id: "gold", label: "Ouro", gradient: "from-yellow-400 via-amber-500 to-orange-500", borderColor: "border-amber-400/40", cost: 150, premiumOnly: false },
  { id: "arctic", label: "Ártico", gradient: "from-sky-200 via-blue-400 to-indigo-500", borderColor: "border-sky-300/40", cost: 100, premiumOnly: false },
  { id: "lava", label: "Lava", gradient: "from-red-600 via-orange-500 to-yellow-400", borderColor: "border-red-500/40", cost: 200, premiumOnly: false },
  { id: "holographic", label: "Holográfico", gradient: "from-violet-400 via-pink-400 to-cyan-400", borderColor: "border-violet-300/40", cost: 0, premiumOnly: true },
  { id: "diamond", label: "Diamante", gradient: "from-slate-200 via-blue-200 to-purple-200", borderColor: "border-slate-200/40", cost: 0, premiumOnly: true },
  { id: "aurora", label: "Aurora", gradient: "from-green-300 via-blue-400 to-purple-500", borderColor: "border-green-300/40", cost: 0, premiumOnly: true },
];

export function getTheme(themeId: string): ProfileTheme {
  return PROFILE_THEMES.find((t) => t.id === themeId) ?? PROFILE_THEMES[0];
}

// ──────────────────────────────────────────
// Coin rewards config
// ──────────────────────────────────────────

export const COIN_REWARDS = {
  daily_login: 5,
  streak_3: 10,
  streak_7: 25,
  streak_14: 50,
  streak_30: 100,
  mission_complete: 10,
  achievement_unlock: 15,
  blog_read: 3,
  level_up: 20,
} as const;

export type CoinRewardReason = keyof typeof COIN_REWARDS | "purchase" | "theme_unlock";

// ──────────────────────────────────────────
// Coin operations
// ──────────────────────────────────────────

export async function addCoins(
  userId: string,
  amount: number,
  reason: string,
) {
  await prisma.$transaction([
    prisma.playerUser.update({
      where: { id: userId },
      data: { coins: { increment: amount } },
    }),
    prisma.coinTransaction.create({
      data: { userId, amount, reason },
    }),
  ]);
}

export async function spendCoins(
  userId: string,
  amount: number,
  reason: string,
) {
  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: { coins: true },
  });

  if (!user || user.coins < amount) {
    throw new Error("Moedas insuficientes.");
  }

  await prisma.$transaction([
    prisma.playerUser.update({
      where: { id: userId },
      data: { coins: { decrement: amount } },
    }),
    prisma.coinTransaction.create({
      data: { userId, amount: -amount, reason },
    }),
  ]);
}

export async function getPlayerCoins(userId: string): Promise<number> {
  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: { coins: true },
  });
  return user?.coins ?? 0;
}

export async function listCoinHistory(userId: string, limit = 20) {
  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    reason: t.reason,
    createdAt: t.createdAt.toISOString(),
  }));
}

// ──────────────────────────────────────────
// Theme purchase
// ──────────────────────────────────────────

export async function unlockTheme(userId: string, themeId: string) {
  const theme = PROFILE_THEMES.find((t) => t.id === themeId);
  if (!theme) throw new Error("Tema não encontrado.");

  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: { isPremium: true, coins: true, profileTheme: true },
  });
  if (!user) throw new Error("Jogador não encontrado.");

  if (theme.premiumOnly && !user.isPremium) {
    throw new Error("Este tema é exclusivo para membros Premium.");
  }

  if (theme.cost > 0) {
    if (user.coins < theme.cost) throw new Error("Moedas insuficientes.");
    await spendCoins(userId, theme.cost, "theme_unlock");
  }

  await prisma.playerUser.update({
    where: { id: userId },
    data: { profileTheme: themeId },
  });

  return theme;
}

// ──────────────────────────────────────────
// Premium
// ──────────────────────────────────────────

export async function isPlayerPremium(userId: string): Promise<boolean> {
  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumUntil: true },
  });

  if (!user) return false;
  if (!user.isPremium) return false;
  if (user.premiumUntil && user.premiumUntil < new Date()) return false;
  return true;
}

export async function grantPremium(userId: string, durationDays: number) {
  const premiumUntil = new Date(
    Date.now() + durationDays * 24 * 60 * 60 * 1000,
  );

  await prisma.playerUser.update({
    where: { id: userId },
    data: { isPremium: true, premiumUntil },
  });
}

export async function getPlayerMonetizationProfile(userId: string) {
  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: {
      coins: true,
      isPremium: true,
      premiumUntil: true,
      profileTheme: true,
    },
  });

  if (!user) return null;

  return {
    coins: user.coins,
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil?.toISOString() ?? null,
    profileTheme: user.profileTheme,
    currentTheme: getTheme(user.profileTheme),
  };
}
