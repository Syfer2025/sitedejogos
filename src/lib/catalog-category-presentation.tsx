import type { ReactNode } from "react";

type IconName =
  | "action"
  | "adventure"
  | "arcade"
  | "board"
  | "boys"
  | "card"
  | "casual"
  | "clicker"
  | "cube"
  | "fashion"
  | "fighting"
  | "horror"
  | "hyper"
  | "idle"
  | "music"
  | "multiplayer"
  | "puzzle"
  | "racing"
  | "rpg"
  | "simulation"
  | "shooting"
  | "soccer"
  | "sports"
  | "stickman"
  | "strategy"
  | "study";

type CategoryPresentation = {
  icon: IconName;
  description: string;
  chipClassName: string;
  iconShellClassName: string;
  sectionClassName: string;
  mutedTextClassName: string;
  titleClassName: string;
  linkClassName: string;
};

const DEFAULT_PRESENTATION: CategoryPresentation = {
  icon: "arcade",
  description: "partidas rápidas para descobrir novidades do catálogo.",
  chipClassName: "border-slate-700 bg-slate-900/75 text-slate-200 hover:border-slate-500 hover:text-white",
  iconShellClassName: "border-slate-700 bg-slate-900 text-slate-100",
  sectionClassName:
    "border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),rgba(2,6,23,0.96)_55%)]",
  mutedTextClassName: "text-slate-400",
  titleClassName: "text-slate-50",
  linkClassName: "text-slate-200 hover:text-white",
};

const PRESENTATION_BY_GROUP: Record<string, CategoryPresentation> = {
  action: {
    icon: "action",
    description: "combate, reflexo e impacto imediato em sessões mais intensas.",
    chipClassName: "border-rose-400/30 bg-rose-500/10 text-rose-100 hover:border-rose-300/60 hover:bg-rose-500/15",
    iconShellClassName: "border-rose-400/30 bg-rose-500/12 text-rose-100",
    sectionClassName:
      "border-rose-400/15 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-rose-100/75",
    titleClassName: "text-rose-50",
    linkClassName: "text-rose-100 hover:text-white",
  },
  adventure: {
    icon: "adventure",
    description: "exploração, fuga e progresso em mapas com mais atmosfera.",
    chipClassName: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-500/15",
    iconShellClassName: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
    sectionClassName:
      "border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-emerald-100/75",
    titleClassName: "text-emerald-50",
    linkClassName: "text-emerald-100 hover:text-white",
  },
  arcade: {
    icon: "arcade",
    description: "jogos diretos, score attack e ritmo de portal clássico.",
    chipClassName: "border-sky-400/30 bg-sky-500/10 text-sky-100 hover:border-sky-300/60 hover:bg-sky-500/15",
    iconShellClassName: "border-sky-400/30 bg-sky-500/12 text-sky-100",
    sectionClassName:
      "border-sky-400/15 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-sky-100/75",
    titleClassName: "text-sky-50",
    linkClassName: "text-sky-100 hover:text-white",
  },
  cube: {
    icon: "cube",
    description: "simulações e experiências 3D com foco em espaço e movimento.",
    chipClassName: "border-violet-400/30 bg-violet-500/10 text-violet-100 hover:border-violet-300/60 hover:bg-violet-500/15",
    iconShellClassName: "border-violet-400/30 bg-violet-500/12 text-violet-100",
    sectionClassName:
      "border-violet-400/15 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-violet-100/75",
    titleClassName: "text-violet-50",
    linkClassName: "text-violet-100 hover:text-white",
  },
  fashion: {
    icon: "fashion",
    description: "estilo, makeover e jogos leves focados em criação visual.",
    chipClassName: "border-pink-400/30 bg-pink-500/10 text-pink-100 hover:border-pink-300/60 hover:bg-pink-500/15",
    iconShellClassName: "border-pink-400/30 bg-pink-500/12 text-pink-100",
    sectionClassName:
      "border-pink-400/15 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-pink-100/75",
    titleClassName: "text-pink-50",
    linkClassName: "text-pink-100 hover:text-white",
  },
  hyper: {
    icon: "hyper",
    description: "rodadas rápidas, mecânica simples e volume alto de novidades.",
    chipClassName: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-500/15",
    iconShellClassName: "border-cyan-400/30 bg-cyan-500/12 text-cyan-100",
    sectionClassName:
      "border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-cyan-100/75",
    titleClassName: "text-cyan-50",
    linkClassName: "text-cyan-100 hover:text-white",
  },
  music: {
    icon: "music",
    description: "batida, tempo e controle fino para quem gosta de ritmo.",
    chipClassName: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/15",
    iconShellClassName: "border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-100",
    sectionClassName:
      "border-fuchsia-400/15 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-fuchsia-100/75",
    titleClassName: "text-fuchsia-50",
    linkClassName: "text-fuchsia-100 hover:text-white",
  },
  multiplayer: {
    icon: "multiplayer",
    description: "competição, coop e disputas rápidas com foco em confronto.",
    chipClassName: "border-amber-400/30 bg-amber-500/10 text-amber-100 hover:border-amber-300/60 hover:bg-amber-500/15",
    iconShellClassName: "border-amber-400/30 bg-amber-500/12 text-amber-100",
    sectionClassName:
      "border-amber-400/15 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-amber-100/75",
    titleClassName: "text-amber-50",
    linkClassName: "text-amber-100 hover:text-white",
  },
  puzzle: {
    icon: "puzzle",
    description: "lógica, match e quebra-cabeças para maratonar em sequência.",
    chipClassName: "border-indigo-400/30 bg-indigo-500/10 text-indigo-100 hover:border-indigo-300/60 hover:bg-indigo-500/15",
    iconShellClassName: "border-indigo-400/30 bg-indigo-500/12 text-indigo-100",
    sectionClassName:
      "border-indigo-400/15 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-indigo-100/75",
    titleClassName: "text-indigo-50",
    linkClassName: "text-indigo-100 hover:text-white",
  },
  racing: {
    icon: "racing",
    description: "velocidade, drift e pistas para quem prefere adrenalina.",
    chipClassName: "border-orange-400/30 bg-orange-500/10 text-orange-100 hover:border-orange-300/60 hover:bg-orange-500/15",
    iconShellClassName: "border-orange-400/30 bg-orange-500/12 text-orange-100",
    sectionClassName:
      "border-orange-400/15 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-orange-100/75",
    titleClassName: "text-orange-50",
    linkClassName: "text-orange-100 hover:text-white",
  },
  rpg: {
    icon: "rpg",
    description: "progressão, níveis e fantasia em jogos com mais construção.",
    chipClassName: "border-purple-400/30 bg-purple-500/10 text-purple-100 hover:border-purple-300/60 hover:bg-purple-500/15",
    iconShellClassName: "border-purple-400/30 bg-purple-500/12 text-purple-100",
    sectionClassName:
      "border-purple-400/15 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-purple-100/75",
    titleClassName: "text-purple-50",
    linkClassName: "text-purple-100 hover:text-white",
  },
  shooting: {
    icon: "shooting",
    description: "mira, pressão e confronto direto para partidas mais agressivas.",
    chipClassName: "border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-300/60 hover:bg-red-500/15",
    iconShellClassName: "border-red-400/30 bg-red-500/12 text-red-100",
    sectionClassName:
      "border-red-400/15 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-red-100/75",
    titleClassName: "text-red-50",
    linkClassName: "text-red-100 hover:text-white",
  },
  sports: {
    icon: "sports",
    description: "futebol, basquete e esportes casuais para rodadas rápidas.",
    chipClassName: "border-lime-400/30 bg-lime-500/10 text-lime-100 hover:border-lime-300/60 hover:bg-lime-500/15",
    iconShellClassName: "border-lime-400/30 bg-lime-500/12 text-lime-100",
    sectionClassName:
      "border-lime-400/15 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-lime-100/75",
    titleClassName: "text-lime-50",
    linkClassName: "text-lime-100 hover:text-white",
  },
  strategy: {
    icon: "strategy",
    description: "planejamento, defesa e decisões que mudam a partida.",
    chipClassName: "border-teal-400/30 bg-teal-500/10 text-teal-100 hover:border-teal-300/60 hover:bg-teal-500/15",
    iconShellClassName: "border-teal-400/30 bg-teal-500/12 text-teal-100",
    sectionClassName:
      "border-teal-400/15 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-teal-100/75",
    titleClassName: "text-teal-50",
    linkClassName: "text-teal-100 hover:text-white",
  },
  study: {
    icon: "study",
    description: "desafios de memória, letras e aprendizado com visual leve.",
    chipClassName: "border-blue-400/30 bg-blue-500/10 text-blue-100 hover:border-blue-300/60 hover:bg-blue-500/15",
    iconShellClassName: "border-blue-400/30 bg-blue-500/12 text-blue-100",
    sectionClassName:
      "border-blue-400/15 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),rgba(2,6,23,0.96)_58%)]",
    mutedTextClassName: "text-blue-100/75",
    titleClassName: "text-blue-50",
    linkClassName: "text-blue-100 hover:text-white",
  },
};

const GROUP_BY_CATEGORY: Record<string, keyof typeof PRESENTATION_BY_GROUP> = {
  acao: "action",
  action: "action",
  aventura: "adventure",
  adventure: "adventure",
  arcade: "arcade",
  board: "puzzle",
  boys: "action",
  card: "puzzle",
  cartas: "puzzle",
  casual: "arcade",
  clicker: "hyper",
  corrida: "racing",
  educativo: "study",
  educational: "study",
  esporte: "sports",
  esportes: "sports",
  estrategia: "strategy",
  fighting: "action",
  girls: "fashion",
  luta: "action",
  musica: "music",
  multiplayer: "multiplayer",
  puzzle: "puzzle",
  "quebra-cabeca": "puzzle",
  quebra_cabeca: "puzzle",
  racing: "racing",
  rpg: "rpg",
  shooter: "shooting",
  shooting: "shooting",
  simulacao: "cube",
  soccer: "sports",
  sports: "sports",
  strategy: "strategy",
  tabuleiro: "puzzle",
  terror: "action",
  tiro: "shooting",
  horror: "action",
  hypercasual: "hyper",
  idle: "hyper",
  music: "music",
  stickman: "action",
  simulation: "cube",
  "3d": "cube",
};

const CATEGORY_ICON_BY_KEY: Partial<Record<string, IconName>> = {
  acao: "action",
  action: "action",
  aventura: "adventure",
  adventure: "adventure",
  arcade: "arcade",
  board: "board",
  boys: "boys",
  card: "card",
  cartas: "card",
  casual: "casual",
  clicker: "clicker",
  corrida: "racing",
  educativo: "study",
  educational: "study",
  esporte: "sports",
  esportes: "sports",
  estrategia: "strategy",
  fighting: "fighting",
  girls: "fashion",
  luta: "fighting",
  musica: "music",
  horror: "horror",
  hypercasual: "hyper",
  idle: "idle",
  music: "music",
  multiplayer: "multiplayer",
  puzzle: "puzzle",
  "quebra-cabeca": "puzzle",
  quebra_cabeca: "puzzle",
  racing: "racing",
  rpg: "rpg",
  shooter: "shooting",
  shooting: "shooting",
  simulacao: "simulation",
  simulation: "simulation",
  soccer: "soccer",
  sports: "sports",
  stickman: "stickman",
  strategy: "strategy",
  tabuleiro: "board",
  terror: "horror",
  tiro: "shooting",
  "3d": "cube",
};

function normalizeCategoryKey(category: string) {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function renderIcon(icon: IconName, className?: string): ReactNode {
  const iconClassName = className ?? "h-5 w-5";

  switch (icon) {
    case "action":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M7 5l12 12" strokeLinecap="round" />
          <path d="M14 4l6 6" strokeLinecap="round" />
          <path d="M5 7l4-2 8 8-2 4-4 2-8-8 2-4Z" strokeLinejoin="round" />
        </svg>
      );
    case "adventure":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="12" r="8" />
          <path d="M10 10l5-2-2 5-5 2 2-5Z" strokeLinejoin="round" />
        </svg>
      );
    case "arcade":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="8" width="16" height="10" rx="4" />
          <path d="M8 12h4" strokeLinecap="round" />
          <path d="M10 10v4" strokeLinecap="round" />
          <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "board":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 10h16" strokeLinecap="round" />
          <path d="M10 4v16" strokeLinecap="round" />
          <path d="M14 4v16" strokeLinecap="round" />
          <path d="M4 14h16" strokeLinecap="round" />
        </svg>
      );
    case "boys":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M6 14 14 6" strokeLinecap="round" />
          <path d="M14 6h4v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 17c-1.7-1.7-1.7-4.3 0-6l3-3 6 6-3 3c-1.7 1.7-4.3 1.7-6 0Z" strokeLinejoin="round" />
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="6" y="5" width="10" height="14" rx="2" />
          <path d="M10 9h2" strokeLinecap="round" />
          <path d="M9 12h4" strokeLinecap="round" />
          <path d="M12 5h4a2 2 0 0 1 2 2v10" strokeLinecap="round" />
        </svg>
      );
    case "casual":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="14.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "clicker":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="m7 4 8 8-4 1 1 4-2 1-1-4-4 1V4Z" strokeLinejoin="round" />
          <path d="M15 5v3" strokeLinecap="round" />
          <path d="M18 8h-3" strokeLinecap="round" />
        </svg>
      );
    case "cube":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" strokeLinejoin="round" />
          <path d="M12 12 5 8" strokeLinecap="round" />
          <path d="M12 12 19 8" strokeLinecap="round" />
          <path d="M12 12v9" strokeLinecap="round" />
        </svg>
      );
    case "fashion":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="m12 4 1.5 3.5L17 9l-3.5 1.5L12 14l-1.5-3.5L7 9l3.5-1.5L12 4Z" strokeLinejoin="round" />
          <path d="M6 15.5 7 18l2.5 1-2.5 1L6 22l-1-2.5L2.5 18 5 17l1-1.5Z" strokeLinejoin="round" />
          <path d="M18 14l.8 1.9L21 16.7l-2.2.9L18 19.5l-.8-1.9-2.2-.9 2.2-.8.8-1.9Z" strokeLinejoin="round" />
        </svg>
      );
    case "fighting":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 13V9l2-2 2 2v4" strokeLinejoin="round" />
          <path d="M12 13V8l2-2 2 2v5" strokeLinejoin="round" />
          <path d="M6 13h12v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-3Z" strokeLinejoin="round" />
        </svg>
      );
    case "horror":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M7 11a5 5 0 1 1 10 0v6l-2-1.5L13 17l-1-2-1 2-2-1.5L7 17v-6Z" strokeLinejoin="round" />
          <circle cx="10" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="11" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "hyper":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" strokeLinejoin="round" />
        </svg>
      );
    case "idle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 4h8" strokeLinecap="round" />
          <path d="M8 20h8" strokeLinecap="round" />
          <path d="M9 4v4l3 3 3-3V4" strokeLinejoin="round" />
          <path d="M9 20v-4l3-3 3 3v4" strokeLinejoin="round" />
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M15 5v10.5" strokeLinecap="round" />
          <path d="M15 6 9 7.5v9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="18" r="2.5" />
          <circle cx="15" cy="16" r="2.5" />
        </svg>
      );
    case "multiplayer":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M4.5 19c.7-2.7 2.6-4 4.5-4s3.8 1.3 4.5 4" strokeLinecap="round" />
          <path d="M14.5 19c.4-1.9 1.7-3 3.3-3 1.4 0 2.6.8 3.2 2.4" strokeLinecap="round" />
        </svg>
      );
    case "puzzle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 4h4a2 2 0 1 1 4 0h4v6a2 2 0 1 1 0 4v6H4v-6a2 2 0 1 1 0-4V4h4Z" strokeLinejoin="round" />
        </svg>
      );
    case "racing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 12 16 9" strokeLinecap="round" />
          <path d="M9.5 15.5 8 18" strokeLinecap="round" />
          <path d="M14.5 15.5 16 18" strokeLinecap="round" />
        </svg>
      );
    case "rpg":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 3 18 6v5c0 4.5-2.6 7.3-6 10-3.4-2.7-6-5.5-6-10V6l6-3Z" strokeLinejoin="round" />
          <path d="m12 7 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L12 7Z" strokeLinejoin="round" />
        </svg>
      );
    case "simulation":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 7h14" strokeLinecap="round" />
          <path d="M5 12h14" strokeLinecap="round" />
          <path d="M5 17h14" strokeLinecap="round" />
          <circle cx="9" cy="7" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="11" cy="17" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shooting":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 3v3" strokeLinecap="round" />
          <path d="M12 18v3" strokeLinecap="round" />
          <path d="M3 12h3" strokeLinecap="round" />
          <path d="M18 12h3" strokeLinecap="round" />
        </svg>
      );
    case "soccer":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="12" r="7" />
          <path d="m12 8 2.5 1.8-1 3H10.5l-1-3L12 8Z" strokeLinejoin="round" />
          <path d="M9.5 9.8 7.5 12" strokeLinecap="round" />
          <path d="M14.5 9.8 16.5 12" strokeLinecap="round" />
          <path d="M10.5 12.8 9 15.5" strokeLinecap="round" />
          <path d="M13.5 12.8 15 15.5" strokeLinecap="round" />
        </svg>
      );
    case "sports":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5.5 9.2 9l1 3.4h3.6l1-3.4L12 5.5Z" strokeLinejoin="round" />
          <path d="M6 10.5 9.2 9" strokeLinecap="round" />
          <path d="M18 10.5 14.8 9" strokeLinecap="round" />
          <path d="M8.5 17.5 10.2 12.4" strokeLinecap="round" />
          <path d="M15.5 17.5 13.8 12.4" strokeLinecap="round" />
        </svg>
      );
    case "stickman":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="12" cy="6" r="2" />
          <path d="M12 8v5" strokeLinecap="round" />
          <path d="M8.5 11.5 12 10l3.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 19l3-6 3 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "strategy":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 20h8" strokeLinecap="round" />
          <path d="M9 20v-3h6v3" strokeLinejoin="round" />
          <path d="M8.5 17 7 9l3-2 2 1 2-1 3 2-1.5 8" strokeLinejoin="round" />
          <path d="M9 7V4h6v3" strokeLinejoin="round" />
        </svg>
      );
    case "study":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" strokeLinejoin="round" />
          <path d="M5 6h11" strokeLinecap="round" />
          <path d="M9 8.5h6" strokeLinecap="round" />
          <path d="M9 12h6" strokeLinecap="round" />
        </svg>
      );
  }
}

export function getCatalogCategoryPresentation(category: string): CategoryPresentation {
  const normalizedKey = normalizeCategoryKey(category);
  const groupKey = GROUP_BY_CATEGORY[normalizedKey];
  const groupPresentation = groupKey ? PRESENTATION_BY_GROUP[groupKey] : DEFAULT_PRESENTATION;
  const icon = CATEGORY_ICON_BY_KEY[normalizedKey] ?? groupPresentation.icon;

  return icon === groupPresentation.icon
    ? groupPresentation
    : {
        ...groupPresentation,
        icon,
      };
}

export function CatalogCategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const presentation = getCatalogCategoryPresentation(category);
  return renderIcon(presentation.icon, className);
}