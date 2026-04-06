import type { GamificationEventType } from "@/lib/gamification";
import type { Locale } from "@/lib/locale";

export const DAILY_MISSION_KINDS = ["favorite_add", "profile_update", "game_play"] as const;
export type DailyMissionKind = (typeof DAILY_MISSION_KINDS)[number];

export type DailyMissionRecord = {
  id: string;
  dayToken: string;
  kind: DailyMissionKind;
  targetCount: number;
  progressCount: number;
  rewardXp: number;
  isCompleted: boolean;
  completedAt: string | null;
};

type DailyMissionAssignmentContext = {
  favoriteCount: number;
  hasProfileSetup: boolean;
};

type DailyMissionPresentationInput = {
  locale: Locale;
  isAuthenticated: boolean;
  mission: DailyMissionRecord | null;
};

const DAILY_MISSION_LINKS: Record<DailyMissionKind, string> = {
  favorite_add: "/games",
  profile_update: "/account",
  game_play: "/games",
};

export function getDailyMissionHref(kind: DailyMissionKind) {
  return DAILY_MISSION_LINKS[kind];
}

export function selectDailyMissionTemplate(context: DailyMissionAssignmentContext) {
  if (context.favoriteCount === 0) {
    return {
      kind: "favorite_add" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  if (!context.hasProfileSetup) {
    return {
      kind: "profile_update" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  return {
    kind: "game_play" as const,
    targetCount: 2,
    rewardXp: 30,
  };
}

export function selectDailyMissionTemplateFromEvent(event: GamificationEventType) {
  if (event === "favorite_add") {
    return {
      kind: "favorite_add" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  if (event === "profile_update") {
    return {
      kind: "profile_update" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  if (event === "game_play") {
    return {
      kind: "game_play" as const,
      targetCount: 2,
      rewardXp: 30,
    };
  }

  return null;
}

export function missionMatchesEvent(kind: DailyMissionKind, event: GamificationEventType) {
  return kind === event;
}

export function buildDailyMission(input: DailyMissionPresentationInput) {
  const copy =
    input.locale === "en"
      ? {
          guestTitle: "Create your account to save progress.",
          guestDescription:
            "Keep favorites, history, streaks and achievements so each session builds lasting progress.",
          guestProgressLabel: "Goal",
          guestProgressValue: "1 signup",
          favoriteTitle: "Save 1 game to favorites today.",
          favoriteDescription:
            "Build your personal collection and make it faster to return to games that match your taste.",
          profileTitle: "Update your player profile today.",
          profileDescription:
            "Set avatar, bio or favorite categories to sharpen your recommendations and player hub.",
          gamePlayTitle: (targetCount: number) => `Play ${targetCount} game(s) today.`,
          gamePlayDescription:
            "Keep your activity warm, stack XP and give the portal a stronger signal about what deserves priority in your feed.",
          progressLabel: "Progress",
          progressValue: (progressCount: number, targetCount: number) =>
            `${Math.min(progressCount, targetCount)}/${targetCount}`,
          completeTitle: "Daily mission completed.",
          completeDescription: (rewardXp: number) =>
            `Reward unlocked: +${rewardXp} XP. Come back tomorrow for a new objective.`,
          completeValue: (rewardXp: number) => `Done • +${rewardXp} XP`,
          guestCta: "Create account",
          actionCta: "Advance now",
          accountCta: "Open profile",
          completedCta: "View account",
        }
      : input.locale === "es"
      ? {
          guestTitle: "Crea tu cuenta para guardar progreso.",
          guestDescription:
            "Guarda favoritos, historial, rachas y conquistas para que cada sesión tenga progreso real.",
          guestProgressLabel: "Meta",
          guestProgressValue: "1 registro",
          favoriteTitle: "Guarda 1 juego en favoritos hoy.",
          favoriteDescription:
            "Arma tu colección personal y vuelve más rápido a los juegos que mejor combinan contigo.",
          profileTitle: "Actualiza tu perfil de jugador hoy.",
          profileDescription:
            "Configura avatar, bio o categorías favoritas para mejorar tus recomendaciones y tu hub personal.",
          gamePlayTitle: (targetCount: number) => `Juega ${targetCount} partida(s) hoy.`,
          gamePlayDescription:
            "Mantén tu actividad encendida, suma XP y ayuda al portal a entender qué debe subir en tu feed.",
          progressLabel: "Progreso",
          progressValue: (progressCount: number, targetCount: number) =>
            `${Math.min(progressCount, targetCount)}/${targetCount}`,
          completeTitle: "Misión diaria completada.",
          completeDescription: (rewardXp: number) =>
            `Recompensa liberada: +${rewardXp} XP. Vuelve mañana para un nuevo objetivo.`,
          completeValue: (rewardXp: number) => `Hecha • +${rewardXp} XP`,
          guestCta: "Crear cuenta",
          actionCta: "Avanzar ahora",
          accountCta: "Abrir perfil",
          completedCta: "Ver cuenta",
        }
      : {
          guestTitle: "Crie sua conta para salvar progresso.",
          guestDescription:
            "Guarde favoritos, histórico, streak e conquistas para transformar visitas casuais em evolução real.",
          guestProgressLabel: "Objetivo",
          guestProgressValue: "1 cadastro",
          favoriteTitle: "Salve 1 jogo nos favoritos hoje.",
          favoriteDescription:
            "Monte sua coleção pessoal e volte mais rápido para os títulos que mais combinam com você.",
          profileTitle: "Atualize seu perfil de jogador hoje.",
          profileDescription:
            "Ajuste avatar, bio ou categorias favoritas para melhorar recomendações e deixar seu hub mais preciso.",
          gamePlayTitle: (targetCount: number) => `Jogue ${targetCount} partida(s) hoje.`,
          gamePlayDescription:
            "Mantenha a atividade aquecida, some XP e dê um sinal mais forte ao portal sobre o que merece subir no seu feed.",
          progressLabel: "Progresso",
          progressValue: (progressCount: number, targetCount: number) =>
            `${Math.min(progressCount, targetCount)}/${targetCount}`,
          completeTitle: "Missão diária concluída.",
          completeDescription: (rewardXp: number) =>
            `Recompensa liberada: +${rewardXp} XP. Volte amanhã para um novo objetivo.`,
          completeValue: (rewardXp: number) => `Concluída • +${rewardXp} XP`,
          guestCta: "Criar conta",
          actionCta: "Avançar agora",
          accountCta: "Abrir perfil",
          completedCta: "Ver conta",
        };

  if (!input.isAuthenticated) {
    return {
      variant: "guest" as const,
      title: copy.guestTitle,
      description: copy.guestDescription,
      progressLabel: copy.guestProgressLabel,
      progressValue: copy.guestProgressValue,
      href: "/login?mode=register",
      ctaLabel: copy.guestCta,
      isCompleted: false,
    };
  }

  if (!input.mission) {
    return {
      variant: "game_play" as const,
      title: copy.gamePlayTitle(1),
      description: copy.gamePlayDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(0, 1),
      href: "/games",
      ctaLabel: copy.actionCta,
      isCompleted: false,
    };
  }

  if (input.mission.isCompleted) {
    return {
      variant: "completed" as const,
      title: copy.completeTitle,
      description: copy.completeDescription(input.mission.rewardXp),
      progressLabel: copy.progressLabel,
      progressValue: copy.completeValue(input.mission.rewardXp),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel:
        input.mission.kind === "profile_update" ? copy.accountCta : copy.completedCta,
      isCompleted: true,
    };
  }

  if (input.mission.kind === "favorite_add") {
    return {
      variant: "favorite_add" as const,
      title: copy.favoriteTitle,
      description: copy.favoriteDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel: copy.actionCta,
      isCompleted: false,
    };
  }

  if (input.mission.kind === "profile_update") {
    return {
      variant: "profile_update" as const,
      title: copy.profileTitle,
      description: copy.profileDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel: copy.accountCta,
      isCompleted: false,
    };
  }

  return {
    variant: "game_play" as const,
    title: copy.gamePlayTitle(input.mission.targetCount),
    description: copy.gamePlayDescription,
    progressLabel: copy.progressLabel,
    progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
    href: getDailyMissionHref(input.mission.kind),
    ctaLabel: copy.actionCta,
    isCompleted: false,
  };
}