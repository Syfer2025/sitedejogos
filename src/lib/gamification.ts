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
  isActive: boolean;
};

export const DEFAULT_ACHIEVEMENT_DEFINITIONS: AchievementDefinitionInput[] = [
  {
    key: "welcome",
    title: "Boas-vindas ao Nexus",
    description: "Criou sua conta e entrou no portal pela primeira vez.",
    icon: "✨",
    imageUrl: "/achievements/nexus-welcome.gif",
    criteriaType: "account_created",
    threshold: 1,
    xpReward: 25,
    isActive: true,
  },
  {
    key: "firstGame",
    title: "Primeira ficha",
    description: "Jogou seu primeiro título com a conta conectada.",
    icon: "🎮",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 1,
    xpReward: 20,
    isActive: true,
  },
  {
    key: "explorer",
    title: "Explorador do arcade",
    description: "Jogou pelo menos 5 jogos diferentes.",
    icon: "🧭",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 5,
    xpReward: 35,
    isActive: true,
  },
  {
    key: "catalogScout",
    title: "Scout do catálogo",
    description: "Experimentou 10 jogos diferentes dentro do portal.",
    icon: "🛰️",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 10,
    xpReward: 55,
    isActive: true,
  },
  {
    key: "catalogLegend",
    title: "Mapa completo",
    description: "Passou por 25 jogos diferentes e virou referência do catálogo.",
    icon: "🗺️",
    imageUrl: "",
    criteriaType: "unique_games_played",
    threshold: 25,
    xpReward: 110,
    isActive: true,
  },
  {
    key: "firstFavorite",
    title: "Colecionador iniciante",
    description: "Salvou seu primeiro jogo nos favoritos.",
    icon: "⭐",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 1,
    xpReward: 20,
    isActive: true,
  },
  {
    key: "collector",
    title: "Curador de coleção",
    description: "Acumulou 5 jogos favoritos.",
    icon: "🗂",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 5,
    xpReward: 40,
    isActive: true,
  },
  {
    key: "premiumShelf",
    title: "Prateleira premium",
    description: "Montou uma seleção com 12 jogos favoritos.",
    icon: "💎",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 12,
    xpReward: 70,
    isActive: true,
  },
  {
    key: "personalMuseum",
    title: "Museu pessoal",
    description: "Guardou 25 jogos na sua vitrine de favoritos.",
    icon: "🏛️",
    imageUrl: "",
    criteriaType: "favorites_total",
    threshold: 25,
    xpReward: 125,
    isActive: true,
  },
  {
    key: "streak3",
    title: "Ritmo quente",
    description: "Manteve uma sequência de 3 dias ativos.",
    icon: "🔥",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 3,
    xpReward: 30,
    isActive: true,
  },
  {
    key: "streak7",
    title: "Semana perfeita",
    description: "Manteve uma sequência de 7 dias ativos.",
    icon: "🏆",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 7,
    xpReward: 60,
    isActive: true,
  },
  {
    key: "streak14",
    title: "Quinzena elétrica",
    description: "Voltou ao portal por 14 dias seguidos.",
    icon: "⚡",
    imageUrl: "",
    criteriaType: "current_streak",
    threshold: 14,
    xpReward: 95,
    isActive: true,
  },
  {
    key: "profileComplete",
    title: "Perfil calibrado",
    description: "Preencheu avatar, bio ou categorias favoritas.",
    icon: "🛠",
    imageUrl: "",
    criteriaType: "profile_completed",
    threshold: 1,
    xpReward: 20,
    isActive: true,
  },
  {
    key: "marathon",
    title: "Maratona arcade",
    description: "Chegou a 10 partidas registradas na conta.",
    icon: "🚀",
    imageUrl: "",
    criteriaType: "games_played_total",
    threshold: 10,
    xpReward: 50,
    isActive: true,
  },
  {
    key: "extendedSession",
    title: "Sessão prolongada",
    description: "Registrou 25 partidas e mostrou fôlego no portal.",
    icon: "🕹️",
    imageUrl: "",
    criteriaType: "games_played_total",
    threshold: 25,
    xpReward: 80,
    isActive: true,
  },
  {
    key: "xp250",
    title: "Motor ligado",
    description: "Acumulou 250 XP em ações dentro do hub.",
    icon: "💠",
    imageUrl: "",
    criteriaType: "xp_total",
    threshold: 250,
    xpReward: 65,
    isActive: true,
  },
  {
    key: "level5",
    title: "Piloto do Nexus",
    description: "Alcançou o nível 5 e entrou no ritmo do portal.",
    icon: "👑",
    imageUrl: "",
    criteriaType: "level_reached",
    threshold: 5,
    xpReward: 90,
    isActive: true,
  },
  {
    key: "level10",
    title: "Lenda do hub",
    description: "Alcançou o nível 10 e cravou presença entre os veteranos.",
    icon: "🌟",
    imageUrl: "",
    criteriaType: "level_reached",
    threshold: 10,
    xpReward: 160,
    isActive: true,
  },
  {
    key: "reviewer1",
    title: "Crítico amador",
    description: "Avaliou seu primeiro jogo com estrelas.",
    icon: "📜",
    imageUrl: "",
    criteriaType: "ratings_total",
    threshold: 1,
    xpReward: 20,
    isActive: true,
  },
  {
    key: "reviewer10",
    title: "Voz do arcade",
    description: "Deixou sua marca em 10 jogos diferentes através de avaliações.",
    icon: "📢",
    imageUrl: "",
    criteriaType: "ratings_total",
    threshold: 10,
    xpReward: 60,
    isActive: true,
  },
  {
    key: "supporter1",
    title: "Patrocinador local",
    description: "Ajudou o portal assistindo a um anúncio premiado.",
    icon: "📺",
    imageUrl: "",
    criteriaType: "ads_total",
    threshold: 1,
    xpReward: 30,
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
  | "ad_reward_view";

export const EVENT_XP_REWARDS: Record<GamificationEventType, number> = {
  register: 50,
  login: 15,
  favorite_add: 10,
  game_play: 5,
  profile_update: 20,
  rating_add: 10,
  ad_reward_view: 15,
};

export function getLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function getLevelRange(level: number) {
  const currentLevel = Math.max(level, 1);

  return {
    currentLevel,
    currentLevelXp: (currentLevel - 1) * 100,
    nextLevelXp: currentLevel * 100,
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