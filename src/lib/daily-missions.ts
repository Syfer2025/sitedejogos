import type { GamificationEventType } from "@/lib/gamification";
import { getLocaleContentLocale, type Locale } from "@/lib/locale";

export const DAILY_MISSION_KINDS = [
  "favorite_add",
  "profile_update",
  "game_play",
  "rating_add",
  "ad_reward_view",
  "comment_add",
] as const;
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
  favorite_add: "/#catalogo",
  profile_update: "/account",
  game_play: "/#catalogo",
  rating_add: "/#catalogo",
  ad_reward_view: "/#catalogo",
  comment_add: "/#catalogo",
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

  if (Math.random() > 0.6) {
    return {
      kind: "rating_add" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  if (Math.random() > 0.8) {
    return {
      kind: "ad_reward_view" as const,
      targetCount: 1,
      rewardXp: 35,
    };
  }

  if (Math.random() > 0.7) {
    return {
      kind: "comment_add" as const,
      targetCount: 1,
      rewardXp: 30,
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

  if (event === "rating_add") {
    return {
      kind: "rating_add" as const,
      targetCount: 1,
      rewardXp: 25,
    };
  }

  if (event === "ad_reward_view") {
    return {
      kind: "ad_reward_view" as const,
      targetCount: 1,
      rewardXp: 35,
    };
  }

  if (event === "comment_add") {
    return {
      kind: "comment_add" as const,
      targetCount: 1,
      rewardXp: 30,
    };
  }

  return null;
}

export function missionMatchesEvent(kind: DailyMissionKind, event: GamificationEventType) {
  return kind === event;
}

export function buildDailyMission(input: DailyMissionPresentationInput) {
  const contentLocale = getLocaleContentLocale(input.locale);
  const copy =
    contentLocale === "en"
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
          ratingTitle: "Rate 1 game today.",
          ratingDescription:
            "Give 1 to 5 stars to any game to help other players find the best content in the portal.",
          adTitle: "Watch 1 rewarded ad today.",
          adDescription:
            "Support the portal and earn bonus XP by watching a short video highlight.",
          commentTitle: "Comment on 1 game today.",
          commentDescription:
            "Share your opinion on any game and help other players discover hidden gems.",
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
      : contentLocale === "es"
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
          ratingTitle: "Califica 1 juego hoy.",
          ratingDescription:
            "Da de 1 a 5 estrellas a cualquier juego para ayudar a otros a encontrar lo mejor del portal.",
          adTitle: "Mira 1 anuncio premiado hoy.",
          adDescription:
            "Apoya al portal y gana XP extra mirando un corto video destacado.",
          commentTitle: "Comenta en 1 juego hoy.",
          commentDescription:
            "Comparte tu opinión en cualquier juego y ayuda a otros jugadores a descubrir joyas ocultas.",
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
          ratingTitle: "Avalie 1 jogo hoje.",
          ratingDescription:
            "Dê de 1 a 5 estrelas em qualquer jogo para ajudar outros jogadores e melhorar o catálogo.",
          adTitle: "Veja 1 anúncio premiado hoje.",
          adDescription:
            "Apoie o portal e ganhe XP bônus assistindo a um rápido vídeo de destaque.",
          commentTitle: "Comente em 1 jogo hoje.",
          commentDescription:
            "Compartilhe sua opinião em qualquer jogo e ajude outros jogadores a descobrir títulos escondidos.",
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
      href: "/#catalogo",
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

  if (input.mission.kind === "rating_add") {
    return {
      variant: "rating_add" as const,
      title: copy.ratingTitle,
      description: copy.ratingDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel: copy.actionCta,
      isCompleted: false,
    };
  }

  if (input.mission.kind === "ad_reward_view") {
    return {
      variant: "ad_reward_view" as const,
      title: copy.adTitle,
      description: copy.adDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel: copy.actionCta,
      isCompleted: false,
    };
  }

  if (input.mission.kind === "comment_add") {
    return {
      variant: "comment_add" as const,
      title: copy.commentTitle,
      description: copy.commentDescription,
      progressLabel: copy.progressLabel,
      progressValue: copy.progressValue(input.mission.progressCount, input.mission.targetCount),
      href: getDailyMissionHref(input.mission.kind),
      ctaLabel: copy.actionCta,
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