/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";
const PROJECT_ROOT = process.env.npm_package_json
  ? path.dirname(process.env.npm_package_json)
  : process.cwd();
const DEFAULT_SQLITE_PATH = path.join(PROJECT_ROOT, "dev.db");

function resolveSqlitePath(databaseUrl) {
  if (databaseUrl === "file:./dev.db") {
    return DEFAULT_SQLITE_PATH;
  }

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL precisa usar o formato file: para SQLite.");
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath) ? rawPath : path.join(PROJECT_ROOT, rawPath);
}

function buildAvatarDataUrl(primary, secondary, accent, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient></defs><rect width="160" height="160" rx="40" fill="url(#g)"/><circle cx="80" cy="60" r="28" fill="rgba(255,255,255,0.9)"/><path d="M34 133c8-26 28-39 46-39s38 13 46 39" fill="rgba(255,255,255,0.94)"/><circle cx="126" cy="34" r="14" fill="${accent}" fill-opacity="0.88"/><text x="126" y="39" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#08111f">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: resolveSqlitePath(DATABASE_URL),
    }),
  });

  const now = new Date();
  const email = "demo@gaming-portal.local";
  const password = "Demo123456!";
  const passwordHash = await hash(password, 10);

  try {
    const games = await prisma.game.findMany({
      where: { isPublished: true },
      orderBy: [
        { featured: "desc" },
        { views: "desc" },
        { popularityScore: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        category: true,
      },
    });

    if (games.length === 0) {
      throw new Error("Nenhum jogo publicado encontrado para montar a conta demo.");
    }

    const categoryCounts = new Map();
    games.forEach((game) => {
      if (!game.category) {
        return;
      }

      categoryCounts.set(game.category, (categoryCounts.get(game.category) ?? 0) + 1);
    });

    const preferredCategories = Array.from(categoryCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([category]) => category);

    const pickedGames = [];
    const seenGameIds = new Set();

    [...games.filter((game) => preferredCategories.includes(game.category)), ...games].forEach(
      (game) => {
        if (seenGameIds.has(game.id)) {
          return;
        }

        seenGameIds.add(game.id);
        pickedGames.push(game);
      },
    );

    const favoriteGames = pickedGames.slice(0, 5);
    const historyGames = pickedGames.slice(0, 6);
    const playCounts = [5, 4, 3, 2, 2, 1];
    const leaderboardPlayers = [
      {
        email: "nova@gaming-portal.local",
        displayName: "Nova Vector",
        bio: "Acelera em corridas e domina tabelas de XP.",
        preferredCategories: [preferredCategories[0] ?? "Racing", preferredCategories[1] ?? "Arcade"],
        xp: 520,
        level: 6,
        currentStreak: 9,
        longestStreak: 12,
        avatarUrl: buildAvatarDataUrl("#22d3ee", "#0f172a", "#fde047", "N"),
      },
      {
        email: "drift@gaming-portal.local",
        displayName: "Drift Queen",
        bio: "Racer competitiva e fan de missões diárias.",
        preferredCategories: [preferredCategories[0] ?? "Racing", preferredCategories[2] ?? "Sports"],
        xp: 470,
        level: 5,
        currentStreak: 8,
        longestStreak: 10,
        avatarUrl: buildAvatarDataUrl("#38bdf8", "#082f49", "#fb7185", "D"),
      },
      {
        email: "pixel@gaming-portal.local",
        displayName: "Pixel Ranger",
        bio: "Curte arcade e coleção de badges raras.",
        preferredCategories: [preferredCategories[1] ?? "Arcade", preferredCategories[2] ?? "Sports"],
        xp: 430,
        level: 5,
        currentStreak: 7,
        longestStreak: 9,
        avatarUrl: buildAvatarDataUrl("#a78bfa", "#312e81", "#22d3ee", "P"),
      },
      {
        email: "orbit@gaming-portal.local",
        displayName: "Orbit Blaze",
        bio: "Mistura performance, retorno diário e SEO nerd no blog.",
        preferredCategories: [preferredCategories[2] ?? "Sports", preferredCategories[1] ?? "Arcade"],
        xp: 360,
        level: 4,
        currentStreak: 6,
        longestStreak: 8,
        avatarUrl: buildAvatarDataUrl("#10b981", "#052e16", "#facc15", "O"),
      },
      {
        email: "turbo@gaming-portal.local",
        displayName: "Turbo Kid",
        bio: "Entra para jogar rápido, favoritar e subir no ranking.",
        preferredCategories: [preferredCategories[0] ?? "Racing"],
        xp: 315,
        level: 4,
        currentStreak: 5,
        longestStreak: 6,
        avatarUrl: buildAvatarDataUrl("#fb7185", "#4c0519", "#93c5fd", "T"),
      },
      {
        email: "quest@gaming-portal.local",
        displayName: "Quest Fox",
        bio: "Coleciona streak, progresso e artigos novos do portal.",
        preferredCategories: [preferredCategories[1] ?? "Arcade"],
        xp: 260,
        level: 3,
        currentStreak: 4,
        longestStreak: 5,
        avatarUrl: buildAvatarDataUrl("#34d399", "#064e3b", "#e879f9", "Q"),
      },
    ];

    const user = await prisma.playerUser.upsert({
      where: { email },
      update: {
        displayName: "Jogador Demo",
        passwordHash,
        avatarUrl: "",
        bio: "Conta demo para revisar a experiencia autenticada do portal.",
        preferredCategories: preferredCategories.join(","),
        xp: 285,
        level: 3,
        currentStreak: 4,
        longestStreak: 7,
        lastEngagedAt: now,
      },
      create: {
        email,
        displayName: "Jogador Demo",
        passwordHash,
        avatarUrl: "",
        bio: "Conta demo para revisar a experiencia autenticada do portal.",
        preferredCategories: preferredCategories.join(","),
        xp: 285,
        level: 3,
        currentStreak: 4,
        longestStreak: 7,
        lastEngagedAt: now,
      },
      select: { id: true },
    });

    await prisma.playerSession.deleteMany({ where: { userId: user.id } });
    await prisma.favoriteGame.deleteMany({ where: { userId: user.id } });
    await prisma.recentlyPlayed.deleteMany({ where: { userId: user.id } });
    await prisma.playerAchievement.deleteMany({ where: { userId: user.id } });
    await prisma.playerNotification.deleteMany({ where: { userId: user.id } });
    await prisma.playerDailyMission.deleteMany({ where: { userId: user.id } });

    if (favoriteGames.length > 0) {
      await prisma.favoriteGame.createMany({
        data: favoriteGames.map((game, index) => ({
          userId: user.id,
          gameId: game.id,
          createdAt: new Date(now.getTime() - index * 60 * 60 * 1000),
        })),
      });
    }

    if (historyGames.length > 0) {
      await prisma.recentlyPlayed.createMany({
        data: historyGames.map((game, index) => ({
          userId: user.id,
          gameId: game.id,
          playCount: playCounts[index] ?? 1,
          createdAt: new Date(now.getTime() - (index + 1) * 24 * 60 * 60 * 1000),
          lastPlayedAt: new Date(now.getTime() - index * 3 * 60 * 60 * 1000),
        })),
      });
    }

    await prisma.playerAchievement.createMany({
      data: [
        ["welcome", "Boas-vindas ao Nexus", "Criou a conta demo.", "*", 25],
        ["firstGame", "Primeira ficha", "Jogou o primeiro titulo.", "G", 20],
        ["explorer", "Explorador do arcade", "Jogou pelo menos 5 jogos.", "E", 35],
        ["firstFavorite", "Colecionador iniciante", "Salvou o primeiro favorito.", "F", 20],
        ["collector", "Curador de colecao", "Acumulou 5 favoritos.", "C", 40],
        ["streak3", "Ritmo quente", "Manteve 3 dias ativos.", "3", 30],
        ["profileComplete", "Perfil calibrado", "Ajustou perfil e preferencias.", "P", 20],
        ["marathon", "Maratona arcade", "Chegou a 10 partidas.", "M", 50],
      ].map(([key, title, description, icon, xpReward], index) => ({
        userId: user.id,
        key,
        title,
        description,
        icon,
        xpReward,
        unlockedAt: new Date(now.getTime() - (index + 1) * 6 * 60 * 60 * 1000),
      })),
    });

    await prisma.playerNotification.createMany({
      data: [
        {
          userId: user.id,
          kind: "achievement",
          title: "Explorador do arcade",
          message: "Conta demo pronta com historico e favoritos.",
          link: "/account",
          isRead: false,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
        {
          userId: user.id,
          kind: "daily_mission",
          title: "Missao diaria em andamento",
          message: "Falta uma partida para concluir a missao de hoje.",
          link: "/games",
          isRead: false,
          createdAt: new Date(now.getTime() - 90 * 60 * 1000),
        },
        {
          userId: user.id,
          kind: "level_up",
          title: "Level 3 alcancado",
          message: "A conta demo ja mostra progresso e streak ativa.",
          link: "/account",
          isRead: true,
          createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          kind: "blog_post",
          title: "Novo no blog: SEO para jogos online",
          message: "Tem artigo novo no blog com dicas para tracao organica do portal.",
          link: "/blog/seo-para-sites-de-jogos-online",
          isRead: false,
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        },
      ],
    });

    await prisma.playerDailyMission.create({
      data: {
        userId: user.id,
        dayToken: now.toISOString().slice(0, 10),
        kind: "game_play",
        targetCount: 2,
        progressCount: 1,
        rewardXp: 30,
        isCompleted: false,
      },
    });

    for (const [index, player] of leaderboardPlayers.entries()) {
      await prisma.playerUser.upsert({
        where: { email: player.email },
        update: {
          displayName: player.displayName,
          passwordHash,
          avatarUrl: player.avatarUrl,
          bio: player.bio,
          preferredCategories: player.preferredCategories.join(","),
          xp: player.xp,
          level: player.level,
          currentStreak: player.currentStreak,
          longestStreak: player.longestStreak,
          lastEngagedAt: new Date(now.getTime() - index * 60 * 60 * 1000),
        },
        create: {
          email: player.email,
          displayName: player.displayName,
          passwordHash,
          avatarUrl: player.avatarUrl,
          bio: player.bio,
          preferredCategories: player.preferredCategories.join(","),
          xp: player.xp,
          level: player.level,
          currentStreak: player.currentStreak,
          longestStreak: player.longestStreak,
          lastEngagedAt: new Date(now.getTime() - index * 60 * 60 * 1000),
        },
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          email,
          password,
          preferredCategories,
          favorites: favoriteGames.map((game) => game.title),
          history: historyGames.map((game) => game.title),
          leaderboardPlayers: leaderboardPlayers.map((player) => ({
            email: player.email,
            displayName: player.displayName,
            xp: player.xp,
            level: player.level,
          })),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});