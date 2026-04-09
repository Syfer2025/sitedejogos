export const ACHIEVEMENT_CRITERIA_TYPES = [
  "account_created",
  "games_played_total",
  "unique_games_played",
  "favorites_total",
  "current_streak",
  "profile_completed",
  "xp_total",
  "level_reached",
  "ratings_total",
  "ads_total",
  "comments_total",
] as const;

export type AchievementCriteriaType = (typeof ACHIEVEMENT_CRITERIA_TYPES)[number];

export const ACHIEVEMENT_CRITERIA_LABELS: Record<AchievementCriteriaType, string> = {
  account_created: "Conta criada",
  games_played_total: "Total de partidas",
  unique_games_played: "Jogos diferentes jogados",
  favorites_total: "Total de favoritos",
  current_streak: "Streak atual",
  profile_completed: "Perfil completo",
  xp_total: "XP total",
  level_reached: "Nível alcançado",
  ratings_total: "Avaliações feitas",
  ads_total: "Anúncios premiados assistidos",
  comments_total: "Comentários feitos",
};


export type AchievementDefinitionInput = {
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  criteriaType: AchievementCriteriaType;
  threshold: number;
  xpReward: number;
  coinReward: number;
  isActive: boolean;
};

export const DEFAULT_ACHIEVEMENT_DEFINITIONS: AchievementDefinitionInput[] = [
  // ── Trilha: Exploração do Catálogo (Unique Games) ──
  {
    key: "explorer_bronze",
    title: "Primeira Ficha",
    description: "Jogou seu primeiro título diferente.",
    icon: "🥉",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 1,
    xpReward: 20,
    coinReward: 10,
    isActive: true,
  },
  {
    key: "explorer_silver",
    title: "Scout do Catálogo",
    description: "Experimentou 10 jogos diferentes dentro do portal.",
    icon: "🥈",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 10,
    xpReward: 100,
    coinReward: 50,
    isActive: true,
  },
  {
    key: "explorer_gold",
    title: "Mapa Completo",
    description: "Passou por 50 jogos diferentes e virou referência do catálogo.",
    icon: "🥇",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 50,
    xpReward: 250,
    coinReward: 150,
    isActive: true,
  },
  {
    key: "explorer_diamond",
    title: "Mestre do Arcade",
    description: "Dominou 250 jogos diferentes. Uma verdadeira lenda.",
    icon: "💎",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 250,
    xpReward: 1000,
    coinReward: 500,
    isActive: true,
  },

  // ── Trilha: Coleção Pessoal (Favorites) ──
  {
    key: "collector_bronze",
    title: "Curador Iniciante",
    description: "Salvou seu primeiro jogo nos favoritos.",
    icon: "🥉",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 1,
    xpReward: 20,
    coinReward: 10,
    isActive: true,
  },
  {
    key: "collector_silver",
    title: "Prateleira Premium",
    description: "Acumulou 15 jogos favoritos.",
    icon: "🥈",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 15,
    xpReward: 100,
    coinReward: 50,
    isActive: true,
  },

  // ── Trilha: Comunidade e Voz (Comments/Ratings) ──
  {
    key: "voice_bronze",
    title: "Voz Ativa",
    description: "Deixou seu primeiro comentário em um jogo.",
    icon: "🥉",
    imageUrl: "",
    criteriaType: "comments_total",
    threshold: 1,
    xpReward: 20,
    coinReward: 0,
    isActive: true,
  },
  {
    key: "voice_silver",
    title: "Crítico de Elite",
    description: "Deixou 15 comentários pelo portal.",
    icon: "🥈",
    imageUrl: "",
    criteriaType: "comments_total",
    threshold: 15,
    xpReward: 120,
    coinReward: 50,
    isActive: true,
  },
  {
    key: "rater_bronze",
    title: "Crítico Amador",
    description: "Avaliou seu primeiro jogo.",
    icon: "🥉",
    imageUrl: "",
    criteriaType: "ratings_total",
    threshold: 1,
    xpReward: 15,
    coinReward: 0,
    isActive: true,
  },
  {
    key: "rater_silver",
    title: "Voz do Arcade",
    description: "Avaliou 25 jogos diferentes.",
    icon: "🥈",
    imageUrl: "",
    criteriaType: "ratings_total",
    threshold: 25,
    xpReward: 120,
    coinReward: 40,
    isActive: true,
  },

  // ── Trilha: Dedicação Diária (Streak) ──
  {
    key: "streak_bronze",
    title: "Aquecimento",
    description: "Manteve uma sequência de 3 dias ativos.",
    icon: "🥉",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 3,
    xpReward: 30,
    coinReward: 15,
    isActive: true,
  },
  {
    key: "streak_silver",
    title: "Imparável",
    description: "Manteve uma sequência de 7 dias ativos.",
    icon: "🥈",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 7,
    xpReward: 100,
    coinReward: 50,
    isActive: true,
  },
  {
    key: "streak_gold",
    title: "Fiel ao Hub",
    description: "Voltou ao portal por 30 dias seguidos.",
    icon: "🥇",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 30,
    xpReward: 500,
    coinReward: 250,
    isActive: true,
  },

  // ── Conquistas Isoladas e Especiais ──
  {
    key: "welcome",
    title: "Boas-vindas ao Nexus",
    description: "Criou sua conta e entrou no portal pela primeira vez.",
    icon: "✨",
    imageUrl: "/achievements/nexus-welcome.gif",
    criteriaType: "account_created",
    threshold: 1,
    xpReward: 50,
    coinReward: 0,
    isActive: true,
  },
  {
    key: "profileComplete",
    title: "Perfil Calibrado",
    description: "Preencheu avatar, bio ou categorias favoritas.",
    icon: "🛠",
    imageUrl: "",
    criteriaType: "profile_completed",
    threshold: 1,
    xpReward: 25,
    coinReward: 25,
    isActive: true,
  },
  {
    key: "sponsor",
    title: "Patrocinador Local",
    description: "Ajudou o portal assistindo a um anúncio premiado.",
    icon: "📺",
    imageUrl: "",
    criteriaType: "ads_total",
    threshold: 1,
    xpReward: 25,
    coinReward: 15,
    isActive: true,
  },
];

export type AchievementKey = (typeof DEFAULT_ACHIEVEMENT_DEFINITIONS)[number]["key"];

export type AchievementEvaluationSnapshot = {
  accountCreated: boolean;
  totalGamesPlayed: number;
  uniqueGamesPlayed: number;
  totalFavorites: number;
  currentStreak: number;
  hasProfileSetup: boolean;
  totalXp: number;
  level: number;
  totalRatings: number;
  totalAds: number;
  totalComments: number;
};

export type AchievementProgress = {
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isComplete: boolean;
};

export function matchesAchievementCriteria(
  definition: Pick<AchievementDefinitionInput, "criteriaType" | "threshold">,
  snapshot: AchievementEvaluationSnapshot,
) {
  switch (definition.criteriaType) {
    case "account_created":
      return snapshot.accountCreated;
    case "games_played_total":
      return snapshot.totalGamesPlayed >= definition.threshold;
    case "unique_games_played":
      return snapshot.uniqueGamesPlayed >= definition.threshold;
    case "favorites_total":
      return snapshot.totalFavorites >= definition.threshold;
    case "current_streak":
      return snapshot.currentStreak >= definition.threshold;
    case "profile_completed":
      return snapshot.hasProfileSetup;
    case "xp_total":
      return snapshot.totalXp >= definition.threshold;
    case "level_reached":
      return snapshot.level >= definition.threshold;
    case "ratings_total":
      return snapshot.totalRatings >= definition.threshold;
    case "ads_total":
      return snapshot.totalAds >= definition.threshold;
    case "comments_total":
      return snapshot.totalComments >= definition.threshold;
    default:
      return false;
  }
}

export function getAchievementProgress(
  definition: Pick<AchievementDefinitionInput, "criteriaType" | "threshold">,
  snapshot: AchievementEvaluationSnapshot,
): AchievementProgress {
  let currentValue = 0;
  let targetValue = Math.max(definition.threshold, 1);

  switch (definition.criteriaType) {
    case "account_created":
      currentValue = snapshot.accountCreated ? 1 : 0;
      targetValue = 1;
      break;
    case "games_played_total":
      currentValue = snapshot.totalGamesPlayed;
      break;
    case "unique_games_played":
      currentValue = snapshot.uniqueGamesPlayed;
      break;
    case "favorites_total":
      currentValue = snapshot.totalFavorites;
      break;
    case "current_streak":
      currentValue = snapshot.currentStreak;
      break;
    case "profile_completed":
      currentValue = snapshot.hasProfileSetup ? 1 : 0;
      targetValue = 1;
      break;
    case "xp_total":
      currentValue = snapshot.totalXp;
      break;
    case "level_reached":
      currentValue = snapshot.level;
      break;
    case "ratings_total":
      currentValue = snapshot.totalRatings;
      break;
    case "ads_total":
      currentValue = snapshot.totalAds;
      break;
    case "comments_total":
      currentValue = snapshot.totalComments;
      break;
  }

  const boundedCurrentValue = Math.min(Math.max(currentValue, 0), targetValue);

  return {
    currentValue: boundedCurrentValue,
    targetValue,
    progressPercent: Math.min(
      100,
      Math.max(0, Math.round((boundedCurrentValue / targetValue) * 100)),
    ),
    isComplete: currentValue >= targetValue,
  };
}

export type GamificationEventType =
  | "register"
  | "login"
  | "favorite_add"
  | "game_play"
  | "profile_update"
  | "rating_add"
  | "ad_reward_view"
  | "comment_add";

export const EVENT_XP_REWARDS: Record<GamificationEventType, number> = {
  register: 100,
  login: 15,
  favorite_add: 5,
  game_play: 10,
  profile_update: 25,
  rating_add: 15,
  ad_reward_view: 25,
  comment_add: 20,
};

export function getLevelFromXp(xp: number) {
  if (xp < 1000) return Math.floor(xp / 100) + 1; // 1 to 10
  if (xp < 3500) return Math.floor((xp - 1000) / 250) + 11; // 11 to 20
  if (xp < 18500) return Math.floor((xp - 3500) / 500) + 21; // 21 to 50
  return Math.floor((xp - 18500) / 1000) + 51; // 51+
}

export function getLevelRange(level: number) {
  const currentLevel = Math.max(level, 1);
  let currentLevelXp = 0;
  let nextLevelXp = 100;

  if (currentLevel <= 10) {
    currentLevelXp = (currentLevel - 1) * 100;
    nextLevelXp = currentLevel * 100;
  } else if (currentLevel <= 20) {
    currentLevelXp = 1000 + (currentLevel - 11) * 250;
    nextLevelXp = currentLevelXp + 250;
  } else if (currentLevel <= 50) {
    currentLevelXp = 3500 + (currentLevel - 21) * 500;
    nextLevelXp = currentLevelXp + 500;
  } else {
    currentLevelXp = 18500 + (currentLevel - 51) * 1000;
    nextLevelXp = currentLevelXp + 1000;
  }

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
  };
}

export function getLevelProgress(xp: number) {
  const level = getLevelFromXp(xp);
  const range = getLevelRange(level);
  const progressInLevel = xp - range.currentLevelXp;
  const neededInLevel = range.nextLevelXp - range.currentLevelXp;

  return {
    level,
    totalXp: xp,
    currentLevelXp: range.currentLevelXp,
    nextLevelXp: range.nextLevelXp,
    progressInLevel,
    neededInLevel,
    progressPercent: Math.min(
      100,
      Math.max(0, Math.round((progressInLevel / neededInLevel) * 100)),
    ),
  };
}

export function getCalendarDayToken(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getNextCalendarDayStart(date: Date) {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return next;
}

export function getCalendarDayDiff(previous: Date, next: Date) {
  const previousDay = Date.UTC(
    previous.getUTCFullYear(),
    previous.getUTCMonth(),
    previous.getUTCDate(),
  );
  const nextDay = Date.UTC(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    next.getUTCDate(),
  );

  return Math.round((nextDay - previousDay) / 86_400_000);
}