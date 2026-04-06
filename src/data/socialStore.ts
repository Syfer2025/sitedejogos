import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────
// Friends
// ──────────────────────────────────────────

export type FriendRecord = {
  id: string;
  friendshipId: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  xp: number;
  currentStreak: number;
  isPremium: boolean;
  profileTheme: string;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderLevel: number;
  createdAt: string;
};

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    throw new Error("Você não pode adicionar a si mesmo.");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") throw new Error("Vocês já são amigos.");
    if (existing.status === "pending") throw new Error("Já existe uma solicitação pendente.");
    // If rejected, update to pending again
    await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "pending", senderId, receiverId },
    });
    return;
  }

  await prisma.friendship.create({
    data: { senderId, receiverId, status: "pending" },
  });
}

export async function respondFriendRequest(
  friendshipId: string,
  receiverId: string,
  accept: boolean,
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.receiverId !== receiverId) {
    throw new Error("Solicitação não encontrada.");
  }

  if (friendship.status !== "pending") {
    throw new Error("Solicitação já foi respondida.");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: accept ? "accepted" : "rejected" },
  });
}

export async function removeFriend(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (
    !friendship ||
    (friendship.senderId !== userId && friendship.receiverId !== userId)
  ) {
    throw new Error("Amizade não encontrada.");
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
}

export async function listFriends(userId: string): Promise<FriendRecord[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          xp: true,
          currentStreak: true,
          isPremium: true,
          profileTheme: true,
        },
      },
      receiver: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          xp: true,
          currentStreak: true,
          isPremium: true,
          profileTheme: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return friendships.map((f) => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      id: friend.id,
      friendshipId: f.id,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      level: friend.level,
      xp: friend.xp,
      currentStreak: friend.currentStreak,
      isPremium: friend.isPremium,
      profileTheme: friend.profileTheme,
    };
  });
}

export async function listPendingRequests(userId: string): Promise<FriendRequest[]> {
  const requests = await prisma.friendship.findMany({
    where: { receiverId: userId, status: "pending" },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true, level: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    senderId: r.sender.id,
    senderName: r.sender.displayName,
    senderAvatar: r.sender.avatarUrl,
    senderLevel: r.sender.level,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getFriendCount(userId: string): Promise<number> {
  return prisma.friendship.count({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}

export async function listFriendLeaderboard(userId: string) {
  const friends = await listFriends(userId);

  const userProfile = await prisma.playerUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      level: true,
      xp: true,
      currentStreak: true,
      isPremium: true,
      profileTheme: true,
    },
  });

  const all = [
    ...(userProfile
      ? [
          {
            id: userProfile.id,
            friendshipId: "",
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
            level: userProfile.level,
            xp: userProfile.xp,
            currentStreak: userProfile.currentStreak,
            isPremium: userProfile.isPremium,
            profileTheme: userProfile.profileTheme,
            isCurrentUser: true,
          },
        ]
      : []),
    ...friends.map((f) => ({ ...f, isCurrentUser: false })),
  ];

  return all.sort((a, b) => b.xp - a.xp);
}

export async function findPlayerByEmail(email: string) {
  return prisma.playerUser.findUnique({
    where: { email },
    select: { id: true, displayName: true, avatarUrl: true, level: true },
  });
}

// ──────────────────────────────────────────
// Comments
// ──────────────────────────────────────────

export type GameCommentRecord = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string;
    level: number;
    isPremium: boolean;
    profileTheme: string;
  };
};

export async function createComment(
  gameId: string,
  userId: string,
  content: string,
): Promise<GameCommentRecord> {
  const trimmed = content.trim();
  if (trimmed.length < 2 || trimmed.length > 500) {
    throw new Error("O comentário deve ter entre 2 e 500 caracteres.");
  }

  const comment = await prisma.gameComment.create({
    data: { gameId, userId, content: trimmed },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          isPremium: true,
          profileTheme: true,
        },
      },
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: comment.user,
  };
}

export async function listGameComments(
  gameId: string,
  limit = 20,
): Promise<GameCommentRecord[]> {
  const comments = await prisma.gameComment.findMany({
    where: { gameId, isHidden: false },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          isPremium: true,
          profileTheme: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: c.user,
  }));
}

export async function getCommentCount(gameId: string): Promise<number> {
  return prisma.gameComment.count({
    where: { gameId, isHidden: false },
  });
}
