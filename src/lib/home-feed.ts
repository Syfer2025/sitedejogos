import type { GameRecord } from "@/data/gamesStore";
import type { PlayerProfile } from "@/data/playerStore";
import type { Locale } from "@/lib/locale";

export type HomeFeedGame = Pick<
  GameRecord,
  "id" | "title" | "slug" | "thumbnail" | "description" | "category" | "views" | "featured"
>;

type GamificationSnapshot = {
  level: number;
  xp: number;
  currentStreak: number;
  unreadNotifications: number;
  activeToday: boolean;
  progress: {
    nextLevelXp: number;
  };
};

type DailyMissionInput = {
  locale: Locale;
  isAuthenticated: boolean;
  favoritesCount: number;
  continuePlayingCount: number;
  recommendedCount: number;
  gamification: GamificationSnapshot | null;
  profile: PlayerProfile | null;
};

export function resolveHeroGame(input: {
  continuePlayingGames: HomeFeedGame[];
  recommendedGames: HomeFeedGame[];
  featuredGames: HomeFeedGame[];
  allGames: HomeFeedGame[];
}) {
  if (input.continuePlayingGames.length > 0) {
    return { mode: "continue" as const, game: input.continuePlayingGames[0] };
  }

  if (input.recommendedGames.length > 0) {
    return { mode: "recommended" as const, game: input.recommendedGames[0] };
  }

  if (input.featuredGames.length > 0) {
    return { mode: "featured" as const, game: input.featuredGames[0] };
  }

  return {
    mode: "featured" as const,
    game: input.allGames[0] ?? null,
  };
}

export function buildDailyMission(input: DailyMissionInput) {
  const copy =
    input.locale === "en"
      ? {
          guestTitle: "Create your account to save progress.",
          guestDescription:
            "Keep favorites, history, streaks and achievements so each session builds lasting progress.",
          guestProgressLabel: "Goal",
          guestProgressValue: "1 signup",
          streakTitle: (target: number) => `Keep your streak alive for ${target} day(s).`,
          streakDescription:
            "Open a game today to keep your consistency and continue unlocking XP and return achievements.",
          streakProgressLabel: "Current streak",
          streakProgressValue: (value: number) => `${value} day(s)`,
          favoriteTitle: "Save your first favorite.",
          favoriteDescription:
            "Build your personal collection to return faster to the games that match your taste.",
          favoriteProgressLabel: "Goal",
          favoriteProgressValue: "1 favorite",
          profileTitle: "Complete your player profile.",
          profileDescription:
            "Set avatar, bio or favorite categories to improve recommendations and unlock more progress.",
          profileProgressLabel: "Goal",
          profileProgressValue: "Profile tuned",
          recommendedTitle: "Play a game from your recommended lane.",
          recommendedDescription:
            "Use the homepage recommendations to explore new titles without losing alignment with your profile.",
          recommendedProgressLabel: "Active queue",
          recommendedProgressValue: (value: number) => `${value} suggestion(s)`,
          xpTitle: "Earn XP for the next level.",
          xpDescription:
            "Come back today to level up and keep your account warm inside the portal.",
          xpProgressLabel: "Remaining",
          xpProgressValue: (value: number) => `${value} XP`,
        }
      : input.locale === "es"
      ? {
          guestTitle: "Crea tu cuenta para guardar progreso.",
          guestDescription:
            "Guarda favoritos, historial, rachas y conquistas para que cada sesión tenga progreso real.",
          guestProgressLabel: "Meta",
          guestProgressValue: "1 registro",
          streakTitle: (target: number) => `Mantén tu racha en ${target} día(s).`,
          streakDescription:
            "Abre un juego hoy para sostener tu constancia y seguir desbloqueando XP y conquistas de retorno.",
          streakProgressLabel: "Racha actual",
          streakProgressValue: (value: number) => `${value} día(s)`,
          favoriteTitle: "Guarda tu primer favorito.",
          favoriteDescription:
            "Arma tu colección personal para volver más rápido a los juegos que mejor combinan contigo.",
          favoriteProgressLabel: "Meta",
          favoriteProgressValue: "1 favorito",
          profileTitle: "Completa tu perfil de jugador.",
          profileDescription:
            "Configura avatar, bio o categorías favoritas para mejorar recomendaciones y desbloquear más progreso.",
          profileProgressLabel: "Meta",
          profileProgressValue: "Perfil calibrado",
          recommendedTitle: "Prueba un recomendado de tu ruta.",
          recommendedDescription:
            "Usa las recomendaciones de la home para explorar nuevos juegos sin perder afinidad con tu perfil.",
          recommendedProgressLabel: "Fila activa",
          recommendedProgressValue: (value: number) => `${value} sugerencia(s)`,
          xpTitle: "Gana XP para el próximo nivel.",
          xpDescription:
            "Vuelve a jugar hoy para subir de nivel y mantener tu cuenta siempre activa dentro del portal.",
          xpProgressLabel: "Faltan",
          xpProgressValue: (value: number) => `${value} XP`,
        }
      : {
          guestTitle: "Crie sua conta para salvar progresso.",
          guestDescription:
            "Guarde favoritos, histórico, streak e conquistas para transformar visitas casuais em evolução real.",
          guestProgressLabel: "Objetivo",
          guestProgressValue: "1 cadastro",
          streakTitle: (target: number) => `Mantenha sua streak em ${target} dia(s).`,
          streakDescription:
            "Abra um jogo hoje para manter a consistência e continuar liberando XP e conquistas de retorno.",
          streakProgressLabel: "Streak atual",
          streakProgressValue: (value: number) => `${value} dia(s)`,
          favoriteTitle: "Salve seu primeiro favorito.",
          favoriteDescription:
            "Monte sua coleção pessoal para acelerar o retorno aos jogos que mais combinam com você.",
          favoriteProgressLabel: "Meta",
          favoriteProgressValue: "1 favorito",
          profileTitle: "Complete seu perfil de jogador.",
          profileDescription:
            "Ajuste avatar, bio ou categorias favoritas para melhorar recomendações e desbloquear progresso extra.",
          profileProgressLabel: "Meta",
          profileProgressValue: "Perfil calibrado",
          recommendedTitle: "Teste um recomendado da sua trilha.",
          recommendedDescription:
            "Use as recomendações da home para explorar novos jogos sem perder aderência ao seu perfil.",
          recommendedProgressLabel: "Fila ativa",
          recommendedProgressValue: (value: number) => `${value} sugestão(ões)`,
          xpTitle: "Ganhe XP para o próximo nível.",
          xpDescription:
            "Volte a jogar hoje para avançar de nível e manter sua conta sempre aquecida dentro do portal.",
          xpProgressLabel: "Faltam",
          xpProgressValue: (value: number) => `${value} XP`,
        };

  if (!input.isAuthenticated) {
    return {
      variant: "guest" as const,
      title: copy.guestTitle,
      description: copy.guestDescription,
      progressLabel: copy.guestProgressLabel,
      progressValue: copy.guestProgressValue,
      href: "/login?mode=register",
    };
  }

  if (input.gamification && !input.gamification.activeToday) {
    const targetStreak = Math.max(input.gamification.currentStreak + 1, 1);
    return {
      variant: "streak" as const,
      title: copy.streakTitle(targetStreak),
      description: copy.streakDescription,
      progressLabel: copy.streakProgressLabel,
      progressValue: copy.streakProgressValue(input.gamification.currentStreak),
      href: "/#catalogo",
    };
  }

  if (input.favoritesCount === 0) {
    return {
      variant: "favorite" as const,
      title: copy.favoriteTitle,
      description: copy.favoriteDescription,
      progressLabel: copy.favoriteProgressLabel,
      progressValue: copy.favoriteProgressValue,
      href: "/#catalogo",
    };
  }

  if (!input.profile?.avatarUrl && !input.profile?.bio) {
    return {
      variant: "profile" as const,
      title: copy.profileTitle,
      description: copy.profileDescription,
      progressLabel: copy.profileProgressLabel,
      progressValue: copy.profileProgressValue,
      href: "/account",
    };
  }

  if (input.recommendedCount > 0) {
    return {
      variant: "recommended" as const,
      title: copy.recommendedTitle,
      description: copy.recommendedDescription,
      progressLabel: copy.recommendedProgressLabel,
      progressValue: copy.recommendedProgressValue(input.recommendedCount),
      href: "/account",
    };
  }

  const xpToNextLevel = input.gamification
    ? Math.max(input.gamification.progress.nextLevelXp - input.gamification.xp, 0)
    : 100;

  return {
    variant: "xp" as const,
    title: copy.xpTitle,
    description: copy.xpDescription,
    progressLabel: copy.xpProgressLabel,
    progressValue: copy.xpProgressValue(xpToNextLevel),
    href: input.continuePlayingCount > 0 ? "/account" : "/#catalogo",
  };
}

export function getRecommendedReason(
  profile: PlayerProfile | null,
  games: Array<Pick<GameRecord, "category">>,
) {
  const preferred = profile?.preferredCategories[0];
  if (preferred) {
    return preferred;
  }

  return games[0]?.category ?? null;
}