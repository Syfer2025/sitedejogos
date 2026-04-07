function buildCoverDataUrl(
  colors: string[],
  pattern: "waves" | "grid" | "diagonal" | "circles" | "gradient",
) {
  let patternSvg = "";

  switch (pattern) {
    case "waves":
      patternSvg = `
        <path d="M0 120 Q180 80 360 120 Q540 160 720 120 Q900 80 1080 120 L1080 200 L0 200Z" fill="${colors[1]}" fill-opacity="0.3"/>
        <path d="M0 140 Q180 100 360 140 Q540 180 720 140 Q900 100 1080 140 L1080 200 L0 200Z" fill="${colors[2] ?? colors[1]}" fill-opacity="0.2"/>
      `;
      break;
    case "grid":
      patternSvg = `
        <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="${colors[1]}" stroke-width="0.5" stroke-opacity="0.15"/>
        </pattern></defs>
        <rect width="1080" height="200" fill="url(#g)"/>
      `;
      break;
    case "diagonal":
      patternSvg = `
        <defs><pattern id="d" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="20" stroke="${colors[1]}" stroke-width="1" stroke-opacity="0.1"/>
        </pattern></defs>
        <rect width="1080" height="200" fill="url(#d)"/>
      `;
      break;
    case "circles":
      patternSvg = `
        <circle cx="100" cy="100" r="80" fill="${colors[1]}" fill-opacity="0.08"/>
        <circle cx="400" cy="50" r="120" fill="${colors[2] ?? colors[1]}" fill-opacity="0.06"/>
        <circle cx="800" cy="120" r="100" fill="${colors[1]}" fill-opacity="0.07"/>
        <circle cx="1000" cy="30" r="60" fill="${colors[2] ?? colors[1]}" fill-opacity="0.09"/>
      `;
      break;
    case "gradient":
      patternSvg = "";
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="50%" stop-color="${colors[1]}"/>
        <stop offset="100%" stop-color="${colors[2] ?? colors[0]}"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="200" fill="url(#bg)"/>
    ${patternSvg}
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\n\s+/g, " "))}`;
}

export type CoverPreset = {
  id: string;
  label: string;
  url: string;
  isGif?: boolean;
  isPremium?: boolean;
  price?: number;
};

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: "neon-waves",
    label: "Neon Waves",
    url: buildCoverDataUrl(["#0f172a", "#7c3aed", "#06b6d4"], "waves"),
  },
  {
    id: "cyber-grid",
    label: "Cyber Grid",
    url: buildCoverDataUrl(["#020617", "#3b82f6", "#8b5cf6"], "grid"),
  },
  {
    id: "sunset-gradient",
    label: "Pôr do Sol",
    url: buildCoverDataUrl(["#f97316", "#ec4899", "#8b5cf6"], "gradient"),
  },
  {
    id: "ocean-deep",
    label: "Oceano",
    url: buildCoverDataUrl(["#0c4a6e", "#0891b2", "#06b6d4"], "waves"),
  },
  {
    id: "forest-mist",
    label: "Floresta",
    url: buildCoverDataUrl(["#052e16", "#059669", "#34d399"], "circles"),
    isPremium: true,
    price: 300,
  },
  {
    id: "lava-flow",
    label: "Lava",
    url: buildCoverDataUrl(["#450a0a", "#dc2626", "#f97316"], "diagonal"),
    isPremium: true,
    price: 450,
  },
  {
    id: "aurora-skies",
    label: "Aurora",
    url: buildCoverDataUrl(["#0f172a", "#22d3ee", "#a78bfa"], "waves"),
    isPremium: true,
    price: 800,
  },
  {
    id: "midnight-gold",
    label: "Midnight Gold",
    url: buildCoverDataUrl(["#0f172a", "#854d0e", "#fbbf24"], "diagonal"),
    isPremium: true,
    price: 1500,
  },
  {
    id: "sakura",
    label: "Sakura",
    url: buildCoverDataUrl(["#4c1d95", "#ec4899", "#fda4af"], "circles"),
    isPremium: true,
    price: 2000,
  },
  {
    id: "arctic-frost",
    label: "Ártico",
    url: buildCoverDataUrl(["#0c4a6e", "#bae6fd", "#e0f2fe"], "grid"),
    isPremium: true,
    price: 3000,
  },
];

export function getCoverPresetById(id: string) {
  return COVER_PRESETS.find((p) => p.id === id) ?? null;
}
