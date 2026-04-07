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
  return value === "favorite_add" || value === "profile_update" || value === "game_play";
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
    prisma.playerUser.findUnique({
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
        : "jogar hoje";

    await createPlayerNotification({
      userId,
      kind: "daily_mission",
      title: "Missão diária concluída",
      message: `Você concluiu a missão de ${kindLabel} e recebeu +${updated.rewardXp} XP.`,
      link: getDailyMissionHref(isDailyMissionKind(updated.kind) ? updated.kind : "game_play"),
    });

    await grantXp(userId, updated.rewardXp, `daily_mission:${updated.kind}`);
  }

  return completedNow;
}

async function syncDailyEngagement(userId: string) {
  const user = await prisma.playerUser.findUnique({
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
    const updated = await prisma.playerUser.update({
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

  const updated = await prisma.playerUser.update({
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

  const current = await prisma.playerUser.findUnique({
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

  const updated = await prisma.playerUser.update({
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
    },
  });

  const titlePrefix = definition.icon ? `${definition.icon} ` : "";

  await createPlayerNotification({
    userId,
    kind: "achievement",
    title: `${titlePrefix}${definition.title}`,
    message: `${definition.description} +${definition.xpReward} XP.`,
    link: "/account",
  });

  await grantXp(userId, definition.xpReward, `achievement:${definition.key}`);

  return true;
}

async function evaluateAchievements(userId: string) {
  const [user, favoriteCount, playedGamesCount, playedGamesAgg, definitions] = await Promise.all([
    prisma.playerUser.findUnique({
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
  const streakState = await syncDailyEngagement(userId);
  const baseReward = EVENT_XP_REWARDS[event];
  const shouldGrantBaseXp =
    event === "login" ? Boolean(streakState?.isNewDay) : baseReward > 0;

  const prevLevel = shouldGrantBaseXp
    ? (await prisma.playerUser.findUnique({ where: { id: userId }, select: { level: true } }))?.level ?? 1
    : 0;

  const xpResult = shouldGrantBaseXp ? await grantXp(userId, baseReward, event) : null;

  // ── Coin rewards ──
  // Removed automatic coin injection for login, streaks, achievements, and missions to
  // stop polluting the local currency economy. Only Level Up grants a coin bonus.

  // Level up coin bonus
  if (xpResult && xpResult.level > prevLevel) {
    await addCoins(userId, COIN_REWARDS.level_up, "level_up");
  }

  const unlockedAchievements = await evaluateAchievements(userId);
  const missionCompleted = await syncDailyMissionProgress(userId, event);

  return getPlayerGamificationOverview(userId);
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
  ] = await Promise.all([
    prisma.playerUser.findUnique({
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