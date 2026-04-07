import { prisma } from "@/lib/prisma";
import {
  buildPersonalizationScores,
  scoreGameForPersonalization,
  summarizePersonalizationScores,
  type PlayerTasteProfile,
} from "@/lib/personalization";
import {
  normalizePreferredCategories,
  serializePreferredCategories,
  type PlayerProfileUpdateInput,
} from "@/lib/user-schema";

type RecommendedGame = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  description: string;
  category: string;
  featured: boolean;
  views: number;
  popularityScore: number;
};

type PlayerProfileRow = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  preferredCategories: string;
  xp?: number;
  level?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastEngagedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlayerProfile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  preferredCategories: string[];
  unlockedAvatars: string[];
  unlockedCovers: string[];
  coins: number;
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardPlayer = {
  id: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  level: number;
  currentStreak: number;
  preferredCategories: string[];
  profileTheme: string;
  achievementCount: number;
  friendCount: number;
};

function mapRecommendedGame(game: RecommendedGame) {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    thumbnail: game.thumbnail,
    description: game.description,
    category: game.category,
    featured: game.featured,
    views: game.views,
  };
}

function normalizeGameTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function mapPlayerProfile(user: PlayerProfileRow & { unlockedAvatars?: string; unlockedCovers?: string; coins?: number; }): PlayerProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    coverUrl: (user as unknown as Record<string, string>).coverUrl ?? "",
    bio: user.bio,
    preferredCategories: normalizePreferredCategories(user.preferredCategories),
    unlockedAvatars: user.unlockedAvatars ? user.unlockedAvatars.split(",").filter(Boolean) : [],
    unlockedCovers: user.unlockedCovers ? user.unlockedCovers.split(",").filter(Boolean) : [],
    coins: user.coins ?? 0,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapLeaderboardPlayer(user: {
  id: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  level: number;
  currentStreak: number;
  preferredCategories: string;
  profileTheme: string;
  achievementCount: number;
  friendCount: number;
}): LeaderboardPlayer {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    preferredCategories: normalizePreferredCategories(user.preferredCategories),
    profileTheme: user.profileTheme,
    achievementCount: user.achievementCount,
    friendCount: user.friendCount,
  };
}

export async function getPlayerProfile(userId: string) {
  const user = await prisma.playerUser.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      preferredCategories: true,
      unlockedAvatars: true,
      unlockedCovers: true,
      coins: true,
      xp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      lastEngagedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user ? mapPlayerProfile(user) : null;
}

export async function updatePlayerProfile(
  userId: string,
  input: PlayerProfileUpdateInput,
) {
  try {
    const user = await prisma.playerUser.update({
      where: {
        id: userId,
      },
      data: {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.avatarUrl !== undefined
          ? { avatarUrl: input.avatarUrl }
          : {}),
        ...(input.coverUrl !== undefined
          ? { coverUrl: input.coverUrl }
          : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.preferredCategories !== undefined
          ? {
              preferredCategories: serializePreferredCategories(
                input.preferredCategories,
              ),
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        preferredCategories: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return mapPlayerProfile(user);
  } catch {
    return null;
  }
}

export async function addFavoriteGame(userId: string, gameId: string) {
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!game) {
    return null;
  }

  const existing = await prisma.favoriteGame.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    await prisma.favoriteGame.create({
      data: {
        userId,
        gameId,
      },
    });
  }

  return {
    favorited: true,
    created: !existing,
    game,
  };
}

export async function removeFavoriteGame(userId: string, gameId: string) {
  await prisma.favoriteGame.deleteMany({
    where: {
      userId,
      gameId,
    },
  });

  return { favorited: false };
}

export async function isGameFavorited(userId: string, gameId: string) {
  const favorite = await prisma.favoriteGame.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    select: { id: true },
  });

  return Boolean(favorite);
}

export async function listFavoriteGames(userId: string, limit = 12) {
  return prisma.favoriteGame.findMany({
    where: {
      userId,
      game: {
        isPublished: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      game: true,
    },
  });
}

export async function recordRecentlyPlayed(userId: string, gameId: string) {
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      isPublished: true,
    },
    select: { id: true },
  });

  if (!game) {
    return null;
  }

  const existing = await prisma.recentlyPlayed.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
    select: {
      id: true,
      playCount: true,
    },
  });

  const record = existing
    ? await prisma.recentlyPlayed.update({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        data: {
          playCount: {
            increment: 1,
          },
          lastPlayedAt: new Date(),
        },
      })
    : await prisma.recentlyPlayed.create({
        data: {
          userId,
          gameId,
          playCount: 1,
          lastPlayedAt: new Date(),
        },
      });

  return {
    ...record,
    isFirstPlay: !existing,
  };
}

export async function listRecentlyPlayed(userId: string, limit = 12) {
  return prisma.recentlyPlayed.findMany({
    where: {
      userId,
      game: {
        isPublished: true,
      },
    },
    orderBy: {
      lastPlayedAt: "desc",
    },
    take: limit,
    include: {
      game: true,
    },
  });
}

export async function getPlayerGameState(userId: string, gameId: string) {
  const [favorited, history] = await Promise.all([
    isGameFavorited(userId, gameId),
    prisma.recentlyPlayed.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
      select: {
        playCount: true,
        lastPlayedAt: true,
      },
    }),
  ]);

  return {
    favorited,
    playCount: history?.playCount ?? 0,
    lastPlayedAt: history?.lastPlayedAt ?? null,
  };
}

export async function listRecommendedGames(userId: string, limit = 6) {
  const [profile, favorites, history] = await Promise.all([
    prisma.playerUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        preferredCategories: true,
      },
    }),
    prisma.favoriteGame.findMany({
      where: {
        userId,
        game: {
          isPublished: true,
        },
      },
      include: {
        game: {
          select: {
            id: true,
            category: true,
            tags: true,
          },
        },
      },
      take: 24,
    }),
    prisma.recentlyPlayed.findMany({
      where: {
        userId,
        game: {
          isPublished: true,
        },
      },
      include: {
        game: {
          select: {
            id: true,
            category: true,
            tags: true,
          },
        },
      },
      take: 24,
    }),
  ]);

  const excludedGameIds = new Set<string>();
  const profileCategories = normalizePreferredCategories(
    profile?.preferredCategories,
  );

  favorites.forEach((entry) => {
    excludedGameIds.add(entry.gameId);
  });

  history.forEach((entry) => {
    excludedGameIds.add(entry.gameId);
  });

  const personalizationScores = buildPersonalizationScores({
    preferredCategories: profileCategories,
    favorites: favorites.map((entry) => ({
      category: entry.game.category,
      tags: normalizeGameTags(entry.game.tags),
    })),
    history: history.map((entry) => ({
      category: entry.game.category,
      tags: normalizeGameTags(entry.game.tags),
      playCount: entry.playCount,
    })),
  });
  const hasPersonalizationSignals =
    personalizationScores.categoryScores.size > 0 ||
    personalizationScores.tagScores.size > 0;

  const candidateGames = await prisma.game.findMany({
    where: {
      isPublished: true,
      id: {
        notIn: Array.from(excludedGameIds),
      },
    },
    orderBy: [
      { featured: "desc" },
      { popularityScore: "desc" },
      { views: "desc" },
      { createdAt: "desc" },
    ],
    take: hasPersonalizationSignals ? Math.max(limit * 12, 72) : limit,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      description: true,
      category: true,
      featured: true,
      views: true,
      popularityScore: true,
      tags: true,
    },
  });

  if (!hasPersonalizationSignals) {
    return candidateGames.slice(0, limit).map(mapRecommendedGame);
  }

  return candidateGames
    .map((game) => ({
      ...game,
      recommendationScore: scoreGameForPersonalization(
        {
          category: game.category,
          tags: normalizeGameTags(game.tags),
          featured: game.featured,
          views: game.views,
        },
        personalizationScores,
      ),
    }))
    .sort(
      (left, right) =>
        right.recommendationScore - left.recommendationScore ||
        right.popularityScore - left.popularityScore ||
        right.views - left.views,
    )
    .slice(0, limit)
    .map(mapRecommendedGame);
}

export async function getPlayerTasteProfile(userId: string): Promise<PlayerTasteProfile | null> {
  const [profile, favorites, history] = await Promise.all([
    prisma.playerUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        preferredCategories: true,
      },
    }),
    prisma.favoriteGame.findMany({
      where: {
        userId,
        game: {
          isPublished: true,
        },
      },
      select: {
        game: {
          select: {
            category: true,
            tags: true,
          },
        },
      },
      take: 24,
    }),
    prisma.recentlyPlayed.findMany({
      where: {
        userId,
        game: {
          isPublished: true,
        },
      },
      select: {
        playCount: true,
        game: {
          select: {
            category: true,
            tags: true,
          },
        },
      },
      take: 24,
    }),
  ]);

  if (!profile) {
    return null;
  }

  return summarizePersonalizationScores(
    buildPersonalizationScores({
      preferredCategories: normalizePreferredCategories(profile.preferredCategories),
      favorites: favorites.map((entry) => ({
        category: entry.game.category,
        tags: normalizeGameTags(entry.game.tags),
      })),
      history: history.map((entry) => ({
        category: entry.game.category,
        tags: normalizeGameTags(entry.game.tags),
        playCount: entry.playCount,
      })),
    }),
  );
}

export async function listTopPlayers(limit = 5) {
  const players = await prisma.playerUser.findMany({
    orderBy: [{ xp: "desc" }, { currentStreak: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      xp: true,
      level: true,
      currentStreak: true,
      preferredCategories: true,
      profileTheme: true,
    },
  });

  const playerIds = players.map((player) => player.id);
  const playerIdsSet = new Set(playerIds);

  const [achievementCounts, friendships] = await Promise.all([
    prisma.playerAchievement.groupBy({
      by: ["userId"],
      where: {
        userId: {
          in: playerIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          {
            senderId: {
              in: playerIds,
            },
          },
          {
            receiverId: {
              in: playerIds,
            },
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    }),
  ]);

  const achievementCountByUserId = new Map(
    achievementCounts.map((entry) => [entry.userId, entry._count._all]),
  );
  const friendCountByUserId = new Map<string, number>();

  friendships.forEach((friendship) => {
    if (playerIdsSet.has(friendship.senderId)) {
      friendCountByUserId.set(
        friendship.senderId,
        (friendCountByUserId.get(friendship.senderId) ?? 0) + 1,
      );
    }

    if (playerIdsSet.has(friendship.receiverId)) {
      friendCountByUserId.set(
        friendship.receiverId,
        (friendCountByUserId.get(friendship.receiverId) ?? 0) + 1,
      );
    }
  });

  return players.map((player) =>
    mapLeaderboardPlayer({
      ...player,
      achievementCount: achievementCountByUserId.get(player.id) ?? 0,
      friendCount: friendCountByUserId.get(player.id) ?? 0,
    }),
  );
}

export async function getPlayerLeaderboardPosition(userId: string) {
  const user = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      currentStreak: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const betterPlayers = await prisma.playerUser.count({
    where: {
      OR: [
        { xp: { gt: user.xp } },
        { xp: user.xp, currentStreak: { gt: user.currentStreak } },
        {
          xp: user.xp,
          currentStreak: user.currentStreak,
          createdAt: { lt: user.createdAt },
        },
      ],
    },
  });

  return betterPlayers + 1;
}