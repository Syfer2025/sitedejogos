export type DefaultGameSeed = {
  title: string;
  iframeUrl: string;
  thumbnail: string;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  views: number;
  popularityScore: number;
};

export const DEFAULT_GAMES: DefaultGameSeed[] = [
  {
    title: "Cyber Drift Racer",
    iframeUrl:
      "https://html5.gamemonetize.co/4xwg353vpjpvle2lmkl8jy2y3wag9b6n/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xys.jpg",
    description:
      "Race por rodovias neon, faça drifts perfeitos e bata o relógio neste arcade de velocidade.",
    category: "Racing",
    tags: ["racing", "neon", "arcade"],
    featured: true,
    views: 2150,
    popularityScore: 89,
  },
  {
    title: "Neon Space Invaders",
    iframeUrl:
      "https://html5.gamemonetize.co/9x8utbfbfngfonj2hgyhj177ggs9r0gr/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyr.jpg",
    description:
      "Proteja a galáxia contra ondas intermináveis de invasores em um shooter arcade rápido e viciante.",
    category: "Arcade",
    tags: ["arcade", "space", "shooter"],
    featured: true,
    views: 1940,
    popularityScore: 84,
  },
  {
    title: "Galaxy Defender",
    iframeUrl:
      "https://html5.gamemonetize.co/gwj6s3f1tuaxtedswlch77qulqy92mql/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyn.jpg",
    description:
      "Segure a linha contra frotas alienígenas em um shooter top-down de ritmo intenso.",
    category: "Shooter",
    tags: ["shooter", "space"],
    featured: false,
    views: 1670,
    popularityScore: 78,
  },
  {
    title: "Pixel Dungeon Quest",
    iframeUrl:
      "https://html5.gamemonetize.co/vvfxt4x1vk8bh1tv04bix4dd2e4m9o0m/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyq.jpg",
    description:
      "Explore calabouços, derrote chefes e evolua seu herói em uma aventura retrô com progressão rápida.",
    category: "RPG",
    tags: ["rpg", "dungeon", "retro"],
    featured: false,
    views: 1240,
    popularityScore: 71,
  },
  {
    title: "Skyline Parkour",
    iframeUrl:
      "https://html5.gamemonetize.co/v7d1030a8d3wva4v5ye5jckq4p4vxvfx/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyp.jpg",
    description:
      "Corra pelos telhados da cidade e encadeie saltos de precisão em desafios cada vez mais rápidos.",
    category: "Action",
    tags: ["action", "parkour", "runner"],
    featured: false,
    views: 910,
    popularityScore: 65,
  },
  {
    title: "Quantum Blocks",
    iframeUrl:
      "https://html5.gamemonetize.co/6v5k42yl93y8luw6hz6v4m3fk4z9x3l0/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyo.jpg",
    description:
      "Resolva puzzles em alta velocidade combinando blocos e efeitos quânticos em partidas curtas.",
    category: "Puzzle",
    tags: ["puzzle", "blocks", "logic"],
    featured: false,
    views: 830,
    popularityScore: 60,
  },
  {
    title: "Night City Skater",
    iframeUrl:
      "https://html5.gamemonetize.co/kay50bzb99r3y2a65sdgh3myl4dr0uq8/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xyq.jpg",
    description:
      "Deslize pela cidade em manobras noturnas e complete combos para dominar o ranking.",
    category: "Sports",
    tags: ["sports", "skate", "arcade"],
    featured: true,
    views: 1490,
    popularityScore: 73,
  },
  {
    title: "Turbo Street Clash",
    iframeUrl:
      "https://html5.gamemonetize.co/8q5mcvck44n7mcg3r3x6r7xj3laxu14k/",
    thumbnail:
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc9xys.jpg",
    description:
      "Corridas urbanas curtas, nitro agressivo e disputas de milissegundos em circuitos cheios de tráfego.",
    category: "Racing",
    tags: ["racing", "street", "nitro"],
    featured: false,
    views: 1580,
    popularityScore: 76,
  },
];