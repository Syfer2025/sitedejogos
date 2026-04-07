function buildAvatarDataUrl(primary: string, secondary: string, accent: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="40" fill="url(#g)"/>
      <circle cx="80" cy="60" r="28" fill="rgba(255,255,255,0.88)"/>
      <path d="M34 133c8-26 28-39 46-39s38 13 46 39" fill="rgba(255,255,255,0.92)"/>
      <circle cx="126" cy="34" r="14" fill="${accent}" fill-opacity="0.9"/>
      <text x="126" y="39" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#08111f">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export type AvatarPreset = {
  id: string;
  label: string;
  url: string;
  isPremium?: boolean;
  price?: number;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "nova",
    label: "Nova",
    url: buildAvatarDataUrl("#22d3ee", "#0f172a", "#fde047", "N"),
  },
  {
    id: "arcade",
    label: "Arcade",
    url: buildAvatarDataUrl("#f97316", "#7c2d12", "#fef08a", "A"),
  },
  {
    id: "racer",
    label: "Racer",
    url: buildAvatarDataUrl("#38bdf8", "#0f172a", "#fb7185", "R"),
  },
  {
    id: "pixel",
    label: "Pixel",
    url: buildAvatarDataUrl("#a78bfa", "#312e81", "#22d3ee", "P"),
  },
  {
    id: "orbit",
    label: "Orbit",
    url: buildAvatarDataUrl("#10b981", "#052e16", "#facc15", "O"),
    isPremium: true,
    price: 150,
  },
  {
    id: "turbo",
    label: "Turbo",
    url: buildAvatarDataUrl("#f43f5e", "#4c0519", "#93c5fd", "T"),
    isPremium: true,
    price: 350,
  },
  {
    id: "drift",
    label: "Drift",
    url: buildAvatarDataUrl("#06b6d4", "#083344", "#fef08a", "D"),
    isPremium: true,
    price: 500,
  },
  {
    id: "quest",
    label: "Quest",
    url: buildAvatarDataUrl("#34d399", "#064e3b", "#e879f9", "Q"),
    isPremium: true,
    price: 800,
  },
  {
    id: "legend",
    label: "Legend",
    url: buildAvatarDataUrl("#eab308", "#450a0a", "#fef08a", "L"),
    isPremium: true,
    price: 3000,
  },
];

export function getAvatarPresetById(id: string) {
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? null;
}
