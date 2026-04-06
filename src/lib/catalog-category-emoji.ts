const CATEGORY_EMOJIS: Record<string, string> = {
  ".io": "🌐",
  "1 player": "🧍",
  "2 player": "👥",
  "2 player games": "🕹️",
  acao: "⚔️",
  action: "⚔️",
  aventura: "🧭",
  adventure: "🧭",
  arcade: "👾",
  "baby hazel": "🧸",
  bejeweled: "💎",
  board: "🎲",
  boys: "🧢",
  card: "🃏",
  cartas: "🃏",
  casual: "🎈",
  clicker: "🖱️",
  cooking: "🍳",
  corrida: "🏎️",
  educativo: "📚",
  educational: "📚",
  egg: "🥚",
  esporte: "🏅",
  esportes: "🏅",
  estrategia: "♟️",
  strategy: "♟️",
  fighting: "🥊",
  luta: "🥊",
  girls: "💄",
  horror: "👻",
  terror: "👻",
  hypercasual: "⚡",
  idle: "⏱️",
  music: "🎵",
  musica: "🎵",
  multiplayer: "🤝",
  puzzle: "🧩",
  quebra_cabeca: "🧩",
  "quebra-cabeca": "🧩",
  racing: "🏎️",
  rpg: "🐉",
  shooter: "🎯",
  shooting: "🎯",
  simulacao: "🧪",
  simulation: "🧪",
  soccer: "⚽",
  sports: "🏅",
  stickman: "🕴️",
  tabuleiro: "🎲",
  tiro: "🎯",
  "3d": "🧊",
};

const FALLBACK_EMOJIS = [
  "🎮",
  "🛰️",
  "🚀",
  "🛸",
  "🪐",
  "🎲",
  "🎯",
  "🧠",
  "🕹️",
  "🏆",
  "🛹",
  "🧬",
];

export function getCategoryEmoji(category: string) {
  const normalizedKey = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (CATEGORY_EMOJIS[normalizedKey]) {
    return CATEGORY_EMOJIS[normalizedKey];
  }

  const hash = Array.from(normalizedKey).reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );

  return FALLBACK_EMOJIS[hash % FALLBACK_EMOJIS.length];
}