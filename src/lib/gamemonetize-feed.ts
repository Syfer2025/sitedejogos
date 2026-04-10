import type { CreateGameInput } from "./game-schema";

export const GAMEMONETIZE_SOURCE = "gamemonetize";

const FEED_ENDPOINT = "https://gamemonetize.com/feed.php";

const GENERIC_TAG_PATTERNS = [
  /^\d{4}\s+games?$/i,
  /^html5$/i,
  /^webgl$/i,
  /^best games?$/i,
  /^amazing$/i,
  /^mobile$/i,
  /^new$/i,
  /free html5 games?/i,
  /games? for your (site|website)/i,
  /html games? for your (site|website)/i,
  /unity games?/i,
  /^mapi games$/i,
] as const;

const PROMOTIONAL_PATTERNS = [
  /web dev\b.*$/i,
  /developer web\b.*$/i,
  /play more games?\b.*$/i,
  /please rate it!?\s*$/i,
] as const;

const HTML_ENTITY_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&apos;": "'",
  "&#39;": "'",
  "&bull;": " ",
  "&copy;": "",
  "&deg;": " deg",
  "&gt;": ">",
  "&hellip;": "...",
  "&larr;": "<-",
  "&ldquo;": '"',
  "&lsquo;": "'",
  "&lt;": "<",
  "&mdash;": "-",
  "&ndash;": "-",
  "&nbsp;": " ",
  "&quot;": '"',
  "&rarr;": "->",
  "&rdquo;": '"',
  "&reg;": "",
  "&rsquo;": "'",
  "&times;": "x",
  "&trade;": "",
  "&uarr;": "up",
  "&zwj;": "",
};

export type GameMonetizeFeedItem = {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  url: string;
  category?: string;
  tags?: string;
  thumb: string;
  width?: string;
  height?: string;
};

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string) {
  let nextValue = value;

  for (const [entity, replacement] of Object.entries(HTML_ENTITY_REPLACEMENTS)) {
    nextValue = nextValue.split(entity).join(replacement);
  }

  nextValue = nextValue.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  nextValue = nextValue.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return nextValue;
}

function normalizeText(value?: string | null) {
  if (!value) {
    return "";
  }

  let nextValue = stripHtml(decodeHtmlEntities(value));

  for (const pattern of PROMOTIONAL_PATTERNS) {
    nextValue = nextValue.replace(pattern, " ");
  }

  nextValue = nextValue.replace(/https?:\/\/\S+/gi, " ");

  return cleanWhitespace(nextValue);
}

function normalizeUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  const sanitized = cleanWhitespace(value)
    .replace(/^\/\//, "https://")
    .replace(/^http:\/\//i, "https://");

  try {
    return new URL(sanitized).toString();
  } catch {
    return "";
  }
}

function toTitleCase(value: string) {
  if (!value) {
    return "";
  }

  return value
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function normalizeTags(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((tag) => normalizeText(tag))
    .filter(Boolean)
    .filter((tag) => !GENERIC_TAG_PATTERNS.some((pattern) => pattern.test(tag)))
    .map((tag) => tag.slice(0, 40))
    .slice(0, 12);
}

function resolveCategory(value: string | undefined, tags: string[]) {
  const normalizedCategory = toTitleCase(normalizeText(value)).slice(0, 60);

  if (normalizedCategory) {
    return normalizedCategory;
  }

  const fallbackTag = tags.find((tag) => tag.length <= 60);

  return fallbackTag ? toTitleCase(fallbackTag).slice(0, 60) : "Arcade";
}

function buildDescription(item: GameMonetizeFeedItem) {
  const description = normalizeText(item.description);

  if (description) {
    return description.slice(0, 5000);
  }

  const instructions = normalizeText(item.instructions);

  if (instructions) {
    return `Controles: ${instructions}`.slice(0, 5000);
  }

  return "Jogo HTML5 disponível para jogar direto no navegador.";
}

export function mapGameMonetizeFeedItem(item: GameMonetizeFeedItem): CreateGameInput | null {
  const title = normalizeText(item.title).slice(0, 120);
  const iframeUrl = normalizeUrl(item.url);
  const thumbnail = normalizeUrl(item.thumb);

  if (!item.id || !title || !iframeUrl || !thumbnail) {
    return null;
  }

  const tags = normalizeTags(item.tags);

  return {
    title,
    iframeUrl,
    thumbnail,
    description: buildDescription(item),
    category: resolveCategory(item.category, tags),
    tags,
    featured: false,
    isPublished: true,
  };
}

export async function fetchGameMonetizeFeedPage(page = 1): Promise<GameMonetizeFeedItem[]> {
  const searchParams = new URLSearchParams({
    format: "0",
    page: String(Math.max(page, 1)),
    popular: "true",
  });

  const response = await fetch(`${FEED_ENDPOINT}?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar feed da GameMonetize: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("O feed da GameMonetize não retornou uma lista de jogos.");
  }

  return payload.filter((entry): entry is GameMonetizeFeedItem => {
    return Boolean(entry && typeof entry === "object");
  });
}