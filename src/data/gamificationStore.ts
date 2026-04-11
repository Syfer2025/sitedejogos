import { listAchievementDefinitions, type AchievementDefinitionRecord } from "@/data/achievementDefinitionsStore";
import { addCoins, COIN_REWARDS } from "@/data/monetizationStore";
import { prisma } from "@/lib/prisma";
import {
  EVENT_XP_REWARDS,
  type AchievementEvaluationSnapshot,
  getCalendarDayDiff,
  getCalendarDayToken,
  getLevelFromXp,
  getLevelProgress,
  matchesAchievementCriteria,
  getNextCalendarDayStart,
  type GamificationEventType,
} from "@/lib/gamification";
import {
  getDailyMissionHref,
  missionMatchesEvent,
  selectDailyMissionTemplate,
  selectDailyMissionTemplateFromEvent,
  type DailyMissionKind,
} from "@/lib/daily-missions";
import { normalizePreferredCategories } from "@/lib/user-schema";

function mapAchievement(achievement: {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  xpReward: number;
  unlockedAt: Date;
}) {
  return {
    id: achievement.id,
    key: achievement.key,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    imageUrl: achievement.imageUrl,
    xpReward: achievement.xpReward,
    unlockedAt: achievement.unlockedAt.toISOString(),
  };
}

function mapNotification(notification: {
  id: string;
  kind: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

function createAchievementSnapshot(input: {
  xp: number;
  level: number;
  currentStreak: number;
  avatarUrl: string;
  bio: string;
  preferredCategories: string;
  favoriteCount: number;
  uniqueGamesPlayed: number;
  totalGamesPlayed: number;
  totalRatings: number;
  totalAds: number;
  totalComments: number;
}): AchievementEvaluationSnapshot {
  return {
    accountCreated: true,
    totalGamesPlayed: input.totalGamesPlayed,
    uniqueGamesPlayed: input.uniqueGamesPlayed,
    totalFavorites: input.favoriteCount,
    currentStreak: input.currentStreak,
    hasProfileSetup: Boolean(
      input.avatarUrl || input.bio || normalizePreferredCategories(input.preferredCategories).length,
    ),
    totalXp: input.xp,
    level: input.level,
    totalRatings: input.totalRatings,
    totalAds: input.totalAds,
    totalComments: input.totalComments,
  };
}

export async function listPlayerAchievements(userId: string, options?: { limit?: number }) {
  const achievements = await prisma.playerAchievement.findMany({
    where: {
      userId,
    },
    orderBy: {
      unlockedAt: "desc",
    },
    ...(options?.limit ? { take: options.limit } : {}),
  });

  return achievements.map(mapAchievement);
}

function isDailyMissionKind(value: string): value is DailyMissionKind {
  return (
    value === "favorite_add" ||
    value === "profile_update" ||
    value === "game_play" ||
    value === "rating_add" ||
    value === "ad_reward_view"
  );
}

function mapDailyMission(mission: {
  id: string;
  dayToken: string;
  kind: string;
  targetCount: number;
  progressCount: number;
  rewardXp: number;
  isCompleted: boolean;
  completedAt: Date | null;
}) {
  return {
    id: mission.id,
    dayToken: mission.dayToken,
    kind: isDailyMissionKind(mission.kind) ? mission.kind : "game_play",
    targetCount: mission.targetCount,
    progressCount: mission.progressCount,
    rewardXp: mission.rewardXp,
    isCompleted: mission.isCompleted,
    completedAt: mission.completedAt?.toISOString() ?? null,
  };
}

async function createPlayerNotification(input: {
  userId: string;
  kind: string;
  title: string;
  message: string;
  link?: string;
}) {
  await prisma.playerNotification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      message: input.message,
      link: input.link ?? "",
    },
  });
}

async function loadDailyMissionAssignmentContext(userId: string) {
  const [user, favoriteCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        avatarUrl: true,
        bio: true,
        preferredCategories: true,
      },
    }),
    prisma.favoriteGame.count({
      where: {
        userId,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  return {
    favoriteCount,
    hasProfileSetup: Boolean(
      user.avatarUrl || user.bio || normalizePreferredCategories(user.preferredCategories).length,
    ),
  };
}

async function createTodayDailyMission(userId: string, seedEvent?: GamificationEventType) {
  const dayToken = getCalendarDayToken(new Date());
  const seededTemplate = seedEvent ? selectDailyMissionTemplateFromEvent(seedEvent) : null;
  const assignmentContext = seededTemplate
    ? null
    : await loadDailyMissionAssignmentContext(userId);

  if (!seededTemplate && !assignmentContext) {
    return null;
  }

  const template = seededTemplate ?? selectDailyMissionTemplate(assignmentContext!);

  try {
    const mission = await prisma.playerDailyMission.create({
      data: {
        userId,
        dayToken,
        kind: template.kind,
        targetCount: template.targetCount,
        rewardXp: template.rewardXp,
      },
      select: {
        id: true,
        dayToken: true,
        kind: true,
        targetCount: true,
        progressCount: true,
        rewardXp: true,
        isCompleted: true,
        completedAt: true,
      },
    });

    return mapDailyMission(mission);
  } catch {
    const mission = await prisma.playerDailyMission.findUnique({
      where: {
        userId_dayToken: {
          userId,
          dayToken,
        },
      },
      select: {
        id: true,
        dayToken: true,
        kind: true,
        targetCount: true,
        progressCount: true,
        rewardXp: true,
        isCompleted: true,
        completedAt: true,
      },
    });

    return mission ? mapDailyMission(mission) : null;
  }
}

async function ensureTodayDailyMission(userId: string, seedEvent?: GamificationEventType) {
  const dayToken = getCalendarDayToken(new Date());
  const mission = await prisma.playerDailyMission.findUnique({
    where: {
      userId_dayToken: {
        userId,
        dayToken,
      },
    },
    select: {
      id: true,
      dayToken: true,
      kind: true,
      targetCount: true,
      progressCount: true,
      rewardXp: true,
      isCompleted: true,
      completedAt: true,
    },
  });

  if (mission) {
    return mapDailyMission(mission);
  }

  return createTodayDailyMission(userId, seedEvent);
}

async function syncDailyMissionProgress(userId: string, event: GamificationEventType): Promise<boolean> {
  const mission = await ensureTodayDailyMission(userId, event);

  if (!mission || mission.isCompleted || !missionMatchesEvent(mission.kind, event)) {
    return false;
  }

  const nextProgress = Math.min(mission.progressCount + 1, mission.targetCount);
  const completedNow = nextProgress >= mission.targetCount;

  const updated = await prisma.playerDailyMission.update({
    where: {
      id: mission.id,
    },
    data: {
      progressCount: nextProgress,
      ...(completedNow
        ? {
            isCompleted: true,
            completedAt: new Date(),
          }
        : {}),
    },
    select: {
      id: true,
      dayToken: true,
      kind: true,
      targetCount: true,
      progressCount: true,
      rewardXp: true,
      isCompleted: true,
      completedAt: true,
    },
  });

  if (completedNow) {
    const kindLabel =
      updated.kind === "favorite_add"
        ? "salvar um favorito"
        : updated.kind === "profile_update"
        ? "atualizar o perfil"
        : updated.kind === "rating_add"
        ? "avaliar um jogo"
        : updated.kind === "ad_reward_view"
        ? "ver um anúncio"
        : "jogar hoje";

    const coinReward = 25; // 25 coins for completing the daily mission

    await createPlayerNotification({
      userId,
      kind: "daily_mission",
      title: "Missão diária concluída",
      message: `Você concluiu a missão de ${kindLabel} e recebeu +${updated.rewardXp} XP e +${coinReward} moedas.`,
      link: getDailyMissionHref(isDailyMissionKind(updated.kind) ? updated.kind : "game_play"),
    });

    await grantXp(userId, updated.rewardXp, `daily_mission:${updated.kind}`);
    await addCoins(userId, coinReward, `daily_mission:${updated.kind}`);
  }

  return completedNow;
}

async function syncDailyEngagement(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastEngagedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const now = new Date();

  if (!user.lastEngagedAt) {
    const updated = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastEngagedAt: now,
      },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastEngagedAt: true,
      },
    });

    return {
      isNewDay: true,
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastEngagedAt: updated.lastEngagedAt,
    };
  }

  const dayDiff = getCalendarDayDiff(user.lastEngagedAt, now);

  if (dayDiff <= 0) {
    return {
      isNewDay: false,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastEngagedAt: user.lastEngagedAt,
    };
  }

  const nextStreak = dayDiff === 1 ? user.currentStreak + 1 : 1;
  const nextLongest = Math.max(user.longestStreak, nextStreak);

  const updated = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      currentStreak: nextStreak,
      longestStreak: nextLongest,
      lastEngagedAt: now,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastEngagedAt: true,
    },
  });

  if (nextStreak > 1) {
    await createPlayerNotification({
      userId,
      kind: "streak",
      title: `Sequência ativa: ${nextStreak} dias`,
      message: "Continue voltando para manter sua streak e liberar novas conquistas.",
      link: "/account",
    });
  }

  return {
    isNewDay: true,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastEngagedAt: updated.lastEngagedAt,
  };
}

async function grantXp(userId: string, amount: number, reason: string) {
  if (amount <= 0) {
    return null;
  }

  const current = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      xp: true,
      level: true,
    },
  });

  if (!current) {
    return null;
  }

  const nextXp = current.xp + amount;
  const nextLevel = getLevelFromXp(nextXp);

  const updated = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      xp: nextXp,
      level: nextLevel,
    },
    select: {
      xp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      lastEngagedAt: true,
    },
  });

  if (nextLevel > current.level) {
    await createPlayerNotification({
      userId,
      kind: "level_up",
      title: `Level ${nextLevel} alcançado`,
      message: `Você subiu de nível graças à ação ${reason} e desbloqueou um novo patamar no portal.`,
      link: "/account",
    });
  }

  return updated;
}

async function unlockAchievement(userId: string, definition: AchievementDefinitionRecord) {
  const existing = await prisma.playerAchievement.findUnique({
    where: {
      userId_key: {
        userId,
        key: definition.key,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return false;
  }

  await prisma.playerAchievement.create({
    data: {
      userId,
      key: definition.key,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      imageUrl: definition.imageUrl,
      xpReward: definition.xpReward,
      coinReward: definition.coinReward,
    },
  });

  // Automatically add the achievement image to unlocked avatars so the user can use it as profile pic
  if (definition.imageUrl) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unlockedAvatars: true }
    });
    const currentUnlocked = user?.unlockedAvatars ? user.unlockedAvatars.split(",").filter(Boolean) : [];
    if (!currentUnlocked.includes(definition.imageUrl)) {
      currentUnlocked.push(definition.imageUrl);
      await prisma.user.update({
        where: { id: userId },
        data: { unlockedAvatars: currentUnlocked.join(",") }
      });
    }
  }

  const titlePrefix = definition.icon ? `${definition.icon} ` : "";
  const coinMessage = definition.coinReward > 0 ? ` e +${definition.coinReward} moedas` : "";

  await createPlayerNotification({
    userId,
    kind: "achievement",
    title: `${titlePrefix}${definition.title}`,
    message: `${definition.description} +${definition.xpReward} XP${coinMessage}.`,
    link: "/account",
  });

  await grantXp(userId, definition.xpReward, `achievement:${definition.key}`);
  
  if (definition.coinReward > 0) {
    await addCoins(userId, definition.coinReward, `achievement:${definition.key}`);
  }

  return true;
}

async function evaluateAchievements(userId: string) {
  const [
    user,
    favoriteCount,
    playedGamesCount,
    playedGamesAgg,
    ratingsCount,
    adsCount,
    commentsCount,
    definitions,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        avatarUrl: true,
        bio: true,
        preferredCategories: true,
        currentStreak: true,
        xp: true,
        level: true,
      },
    }),
    prisma.favoriteGame.count({
      where: {
        userId,
      },
    }),
    prisma.recentlyPlayed.count({
      where: {
        userId,
      },
    }),
    prisma.recentlyPlayed.aggregate({
      where: {
        userId,
      },
      _sum: {
        playCount: true,
      },
    }),
    prisma.gameRating.count({
      where: {
        userId,
      },
    }),
    prisma.rewardedAdView.count({
      where: {
        userId,
      },
    }),
    prisma.gameComment.count({
      where: {
        userId,
        isHidden: false,
      },
    }),
    listAchievementDefinitions(),
  ]);

  if (!user) {
    return [] as string[];
  }

  const unlocked: string[] = [];
  const totalPlays = playedGamesAgg._sum.playCount ?? 0;
  const snapshot = createAchievementSnapshot({
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    preferredCategories: user.preferredCategories,
    favoriteCount,
    uniqueGamesPlayed: playedGamesCount,
    totalGamesPlayed: totalPlays,
    totalRatings: ratingsCount,
    totalAds: adsCount,
    totalComments: commentsCount,
  });

  for (const definition of definitions) {
    if (!matchesAchievementCriteria(definition, snapshot)) {
      continue;
    }

    const created = await unlockAchievement(userId, definition);
    if (created) {
      unlocked.push(definition.key);
    }
  }

  return unlocked;
}

export async function applyGamificationEvent(
  userId: string,
  event: GamificationEventType,
) {
  const { getPlayerLeaderboardPosition } = await import("@/data/playerStore");
  
  // 1. Snapshot initial state (for ranking change detection)
  const prevRank = await getPlayerLeaderboardPosition(userId);
  const prevLevel = (await prisma.user.findUnique({ where: { id: userId }, select: { level: true } }))?.level ?? 1;

  const streakState = await syncDailyEngagement(userId);
  let baseReward = EVENT_XP_REWARDS[event];
  
  // Apply streak multiplier for login
  if (event === "login" && streakState) {
    const activeStreak = streakState.currentStreak;
    const streakBonus = Math.min(35, (activeStreak - 1) * 5);
    baseReward += streakBonus;
  }

  const shouldGrantBaseXp = event === "login" ? Boolean(streakState?.isNewDay) : baseReward > 0;
  const xpResult = shouldGrantBaseXp ? await grantXp(userId, baseReward, event) : null;

  // Level up coin bonus
  if (xpResult && xpResult.level > prevLevel) {
    const levelUpCoins = xpResult.level * 10;
    await addCoins(userId, levelUpCoins, "level_up");
  }

  // 2. Evaluate achievements and collect newly unlocked ones
  const unlockedKeys = await evaluateAchievements(userId);
  const newlyUnlocked = await prisma.playerAchievement.findMany({
    where: {
      userId,
      key: { in: unlockedKeys }
    }
  });

  const missionCompleted = await syncDailyMissionProgress(userId, event);

  // 3. Detect ranking change for the current player (improvement)
  const currentRank = await getPlayerLeaderboardPosition(userId);
  if (currentRank && prevRank && currentRank < prevRank && currentRank <= 100) {
    await createPlayerNotification({
      userId,
      kind: "ranking_up",
      title: "Subiu no Ranking!",
      message: `Parabéns! Você subiu para a posição #${currentRank} no ranking global.`,
      link: "/account"
    });
  }

  // 4. Detect displacement of others (demotion)
  // If current player improved and is now in Top 100, someone might have been pushed down
  if (currentRank && prevRank && currentRank < prevRank && currentRank <= 100) {
    // Find the player who was at 'currentRank' before and is now 'currentRank + 1'
    // This is a simplification, but effective for high-ranking competitive play
    const displacedUser = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        xp: { lte: xpResult?.xp ?? 0 } // Someone who was potentially passed
      },
      orderBy: [
        { xp: "desc" },
        { currentStreak: "desc" },
        { createdAt: "asc" }
      ],
      skip: currentRank - 1, // The new position of the displaced person
      take: 1
    });

    if (displacedUser && currentRank <= 100) {
      await createPlayerNotification({
        userId: displacedUser.id,
        kind: "ranking_down",
        title: "Você foi ultrapassado!",
        message: `Alguém acabou de te passar no ranking global. Volte a jogar para retomar sua posição!`,
        link: "/account"
      });
    }
  }

  return {
    overview: await getPlayerGamificationOverview(userId),
    newlyUnlocked: newlyUnlocked.map(mapAchievement),
    rankChanged: currentRank !== prevRank,
    newRank: currentRank
  };
}

export async function markAllPlayerNotificationsAsRead(userId: string) {
  await prisma.playerNotification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function getPlayerGamificationOverview(userId: string) {
  const dailyMission = await ensureTodayDailyMission(userId);
  const [
    user,
    achievements,
    notifications,
    unreadNotifications,
    dailyMissionHistory,
    favoriteCount,
    uniqueGamesPlayed,
    totalGamesPlayedAgg,
    ratingsCount,
    adsCount,
    commentsCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        lastEngagedAt: true,
        avatarUrl: true,
        bio: true,
        preferredCategories: true,
      },
    }),
    listPlayerAchievements(userId),
    prisma.playerNotification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
    prisma.playerNotification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
    prisma.playerDailyMission.findMany({
      where: {
        userId,
      },
      orderBy: {
        dayToken: "desc",
      },
      take: 5,
      select: {
        id: true,
        dayToken: true,
        kind: true,
        targetCount: true,
        progressCount: true,
        rewardXp: true,
        isCompleted: true,
        completedAt: true,
      },
    }),
    prisma.favoriteGame.count({
      where: {
        userId,
      },
    }),
    prisma.recentlyPlayed.count({
      where: {
        userId,
      },
    }),
    prisma.recentlyPlayed.aggregate({
      where: {
        userId,
      },
      _sum: {
        playCount: true,
      },
    }),
    prisma.gameRating.count({
      where: {
        userId,
      },
    }),
    prisma.rewardedAdView.count({
      where: {
        userId,
      },
    }),
    prisma.gameComment.count({
      where: {
        userId,
        isHidden: false,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  const achievementSnapshot = createAchievementSnapshot({
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    preferredCategories: user.preferredCategories,
    favoriteCount,
    uniqueGamesPlayed,
    totalGamesPlayed: totalGamesPlayedAgg._sum.playCount ?? 0,
    totalRatings: ratingsCount,
    totalAds: adsCount,
    totalComments: commentsCount,
  });

  return {
    id: user.id,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastEngagedAt: user.lastEngagedAt?.toISOString() ?? null,
    activeToday:
      user.lastEngagedAt !== null &&
      getCalendarDayToken(user.lastEngagedAt) === getCalendarDayToken(new Date()),
    progress: getLevelProgress(user.xp),
    achievementSnapshot,
    unreadNotifications,
    achievementCount: achievements.length,
    unlockedAchievementKeys: achievements.map((achievement) => achievement.key),
    achievements: achievements.slice(0, 8),
    notifications: notifications.map(mapNotification),
    dailyMission,
    dailyMissionHistory: dailyMissionHistory.map(mapDailyMission),
    nextDailyMissionAt: getNextCalendarDayStart(new Date()).toISOString(),
  };
}