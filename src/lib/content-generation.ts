import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type GameSEOContent = {
  longDescription: string;
  tips: string;
  controls: string;
  faqJson: string; // JSON string
};

export type CategorySEOContent = {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  body: string;
  benefitsJson: string; // JSON string
  faqJson: string;      // JSON string
};

// ── Game content ─────────────────────────────────────────────────────────────
// Uses claude-haiku (cheapest) — high volume, runs on every new game import.
// Cost: ~$0.003 per game (input+output ~800 tokens total)

export async function generateGameSEOContent(game: {
  title: string;
  description: string;
  category: string;
  tags: string[];
}): Promise<GameSEOContent> {
  const tagsStr = game.tags.slice(0, 8).join(", ") || game.category;

  const prompt = `You are an SEO content writer for a free browser games portal.
Write optimized English content for this HTML5 game page.

Game title: ${game.title}
Category: ${game.category}
Tags: ${tagsStr}
Short description: ${game.description.slice(0, 300) || "A fun browser game."}

Return ONLY a JSON object (no markdown, no explanation) with these exact keys:
{
  "longDescription": "400-500 word engaging description. Cover: what the game is, core gameplay loop, visual style/tone, who will love it, what makes it replayable. Natural writing, no keyword stuffing. Use paragraphs.",
  "tips": "3-4 practical tips to help players succeed. One tip per line, starting with a dash.",
  "controls": "How to play: keyboard keys and/or mouse/touch controls. One control per line, starting with a dash.",
  "faq": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}

The faq must have exactly 5 questions specific to THIS game. Questions like: how to score points, best strategy, unlockable content, multiplayer, mobile support.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

  return {
    longDescription: String(parsed.longDescription ?? "").trim(),
    tips: String(parsed.tips ?? "").trim(),
    controls: String(parsed.controls ?? "").trim(),
    faqJson: JSON.stringify(Array.isArray(parsed.faq) ? parsed.faq : []),
  };
}

// ── Category content ──────────────────────────────────────────────────────────
// Uses claude-sonnet (better quality) — low volume, one per category.
// Cost: ~$0.05 per category (input+output ~3000 tokens)

export async function generateCategorySEOContent(
  category: string,
  topGameTitles: string[],
): Promise<CategorySEOContent> {
  const titlesStr = topGameTitles.slice(0, 15).join(", ");

  const prompt = `You are a senior SEO content writer for a free browser games portal called Gasty Games.
Write high-quality editorial content for the "${category}" games category page.

Top games in this category: ${titlesStr}

Return ONLY a JSON object (no markdown) with these exact keys:
{
  "h1": "Page heading — compelling, includes '${category} Games' naturally (max 60 chars)",
  "metaTitle": "SEO title tag — include '${category} Games Online Free' and brand (max 60 chars)",
  "metaDescription": "Meta description — benefit-driven, call to action, 145-155 chars",
  "intro": "2-3 sentence hook paragraph for the top of the page. Engaging, includes the main keyword naturally.",
  "body": "1200-1500 word editorial article. Structure with H2-level topic sentences (use ** for bold headings inline). Cover: what ${category} games are and why people love them, the different types/sub-genres, what makes a great ${category} game, tips for new players, why playing in browser beats downloading apps, notable game mechanics common in this genre. Write genuinely useful content, not generic filler. Natural reading, no keyword stuffing.",
  "benefits": [
    "Short benefit string 1",
    "Short benefit string 2",
    "Short benefit string 3",
    "Short benefit string 4",
    "Short benefit string 5",
    "Short benefit string 6"
  ],
  "faq": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}

FAQ must be specific to ${category} games. Answers should be 2-3 sentences.
Write everything in English.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

  return {
    h1: String(parsed.h1 ?? `${category} Games Online Free`).trim(),
    metaTitle: String(parsed.metaTitle ?? `${category} Games - Play Free Online | Gasty Games`).trim(),
    metaDescription: String(parsed.metaDescription ?? "").trim(),
    intro: String(parsed.intro ?? "").trim(),
    body: String(parsed.body ?? "").trim(),
    benefitsJson: JSON.stringify(Array.isArray(parsed.benefits) ? parsed.benefits : []),
    faqJson: JSON.stringify(Array.isArray(parsed.faq) ? parsed.faq : []),
  };
}
