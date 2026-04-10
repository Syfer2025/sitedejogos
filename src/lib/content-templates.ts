/**
 * Template-based SEO content generator.
 * Uses game's existing description + category/tags to build
 * longDescription, controls, tips and faqJson — zero external API calls.
 */

type FAQ = { question: string; answer: string };

type CategoryTemplate = {
  controls: string;
  tips: string[];
  faq: FAQ[];
  /** Appended when description is too short */
  extra: string;
};

// ── Category templates ────────────────────────────────────────────────────────

const TEMPLATES: Record<string, CategoryTemplate> = {
  Racing: {
    controls: "- Arrow keys or WASD to steer and accelerate\n- Space bar to brake or handbrake\n- Mouse to navigate menus",
    tips: [
      "- Take the inside line on corners to cut distance and maintain speed.",
      "- Brake before the turn, not during — trail braking causes spin-outs.",
      "- Watch the minimap to anticipate upcoming chicanes and straights.",
      "- Upgrade your engine and grip before adding nitro for best results.",
    ],
    faq: [
      { question: "Is this game free to play?", answer: "Yes, completely free — no download or registration needed. Just open your browser and start racing." },
      { question: "Can I play on mobile?", answer: "Yes. The game runs on Chrome and Safari on Android and iOS devices. Tilt-to-steer is supported on some versions." },
      { question: "How do I unlock new cars?", answer: "Finish races in top positions to earn points. Enough points unlock the next vehicle or track in the series." },
      { question: "Does it have multiplayer?", answer: "Some versions include a split-screen or online leaderboard mode. Check the game's main menu for available modes." },
      { question: "My car keeps spinning out — any tips?", answer: "Ease off the accelerator before hard corners and avoid tapping the brakes mid-turn. Practice the first track until the handling feels natural." },
    ],
    extra: "Whether you prefer circuit races, drift challenges or off-road tracks, this game delivers fast-paced driving action straight in your browser with no installation needed.",
  },

  Shooting: {
    controls: "- Mouse to aim and shoot\n- WASD or arrow keys to move your character\n- R to reload, Space to jump or dodge\n- E or F to interact with objects",
    tips: [
      "- Aim for headshots — they deal more damage and conserve ammo.",
      "- Use cover constantly; peeking out briefly beats standing in the open.",
      "- Manage your ammo — reload only when behind cover, not mid-fight.",
      "- Learn enemy patterns; most enemies telegraph their attacks one frame before firing.",
    ],
    faq: [
      { question: "Is this shooter free?", answer: "Yes, 100% free to play in your browser. No downloads, no installs, no account needed." },
      { question: "Can I play on mobile?", answer: "The game supports touch controls on modern Android and iOS browsers. On-screen buttons replace keyboard and mouse." },
      { question: "How do I get more ammo?", answer: "Ammo drops appear when you defeat enemies or break crates. Some levels have ammo stations you can interact with." },
      { question: "Are there different difficulty levels?", answer: "Most levels offer Normal and Hard mode. Hard mode increases enemy health, damage and spawn rate." },
      { question: "How do I beat the boss?", answer: "Bosses usually have a weak point — look for a glowing area or a part that flashes when hit. Keep moving and dodge their special attacks." },
    ],
    extra: "Fast reflexes and smart positioning are the keys to dominating every level. Lock and load — the action starts the moment you hit play.",
  },

  Puzzle: {
    controls: "- Mouse click or tap to select and interact\n- Drag and drop to move pieces\n- Some puzzles use arrow keys for movement",
    tips: [
      "- Start with the edges and corners when solving grid-based puzzles.",
      "- If stuck, step back and look at the big picture instead of focusing on one area.",
      "- Use the undo button freely — experimenting without penalty is how you learn.",
      "- Time-based levels reward speed, but accuracy matters more than rushing.",
    ],
    faq: [
      { question: "Are the puzzles free?", answer: "Yes, all puzzle levels are completely free — no subscription or download required." },
      { question: "How many levels are there?", answer: "The number of levels varies by game. Many puzzle games include 20–100+ levels of increasing difficulty." },
      { question: "Can kids play this?", answer: "Yes, puzzle games are suitable for all ages. The logic-based gameplay makes them great for kids and adults alike." },
      { question: "Is there a timer?", answer: "Some levels are timed, others are relaxed. Check the game's top bar — a clock icon means there's a time limit." },
      { question: "I'm stuck on a level — what should I do?", answer: "Most puzzle games include a hint button or a skip option after a few failed attempts. Take a break and return with fresh eyes if the hint doesn't help." },
    ],
    extra: "Train your brain with satisfying puzzles that challenge logic, spatial thinking and pattern recognition — all playable for free, directly in your browser.",
  },

  Action: {
    controls: "- WASD or arrow keys to move\n- Mouse to aim, left-click to attack\n- Space bar to jump or dodge\n- Shift to sprint or dash",
    tips: [
      "- Master the dodge/dash mechanic — it's often invincible-frame based and saves lives.",
      "- Chain combos instead of mashing single attacks; combos deal significantly more damage.",
      "- Prioritize dangerous enemies first — ranged attackers are more threatening than melee.",
      "- Collect power-ups even when full health; they usually stack for later in the level.",
    ],
    faq: [
      { question: "Is this action game free?", answer: "Yes, fully free — play directly in Chrome, Firefox or Safari without any installation." },
      { question: "Does it support controllers?", answer: "Some browser action games support USB gamepads through the browser's Gamepad API. Plug in your controller and check the settings menu." },
      { question: "How do I save my progress?", answer: "Progress is typically saved automatically to your browser's local storage. Avoid clearing browser data to keep your save intact." },
      { question: "Are there multiple characters?", answer: "Many action games let you unlock extra characters by completing story mode or reaching score milestones." },
      { question: "How do I deal with hard sections?", answer: "Upgrade your character between levels if possible, and focus on learning the attack pattern rather than button-mashing." },
    ],
    extra: "Explosive combat, tight controls and non-stop action — this game keeps you engaged from the first enemy to the final boss.",
  },

  Adventure: {
    controls: "- Arrow keys or WASD to move and explore\n- E or Space to interact with objects and NPCs\n- I to open inventory, M for map (if available)",
    tips: [
      "- Talk to every NPC — many hold quest clues or secret item locations.",
      "- Explore thoroughly before progressing; hidden areas often contain key upgrades.",
      "- Save before entering new areas or boss encounters.",
      "- Keep a variety of items in your inventory; you never know what puzzle requires what.",
    ],
    faq: [
      { question: "Is the adventure free to play?", answer: "Yes, entirely free — no downloads or account needed to play in your browser." },
      { question: "How long is the game?", answer: "Most browser adventure games last between 30 minutes and several hours depending on how thoroughly you explore." },
      { question: "Is there a save system?", answer: "Progress auto-saves to local storage after key events. Some games also include a manual save option in the pause menu." },
      { question: "Are there multiple endings?", answer: "Many adventure games feature branching paths and multiple endings based on choices made throughout the story." },
      { question: "I'm lost — where do I go next?", answer: "Check your journal or quest log if available. Revisiting the last NPC you spoke with often reveals the next objective." },
    ],
    extra: "Explore a rich world, solve mysteries and uncover a compelling story — all without leaving your browser tab.",
  },

  Sports: {
    controls: "- Arrow keys or WASD to move your athlete\n- Space bar or left-click to kick, shoot or swing\n- Shift to sprint, hold for power shots",
    tips: [
      "- Timing your shot or swing is more important than spamming the action button.",
      "- Study your opponent's patterns in the first round before committing to a strategy.",
      "- Use feints and direction changes to throw off AI defenders.",
      "- Stamina matters — manage sprint usage so you're not exhausted in the final minutes.",
    ],
    faq: [
      { question: "Is this sports game free?", answer: "Yes, completely free to play in your browser — just click and start competing." },
      { question: "Can I play against a friend?", answer: "Some sports games support local 2-player mode on the same keyboard. Check the main menu for a VS or 2-player option." },
      { question: "Are there tournaments or leagues?", answer: "Many sports games include a tournament bracket or career mode where you progress through increasingly difficult opponents." },
      { question: "How do I score more consistently?", answer: "Focus on positioning and wait for the right moment rather than always going for the spectacular shot. Consistency beats flashiness." },
      { question: "Does it work on mobile?", answer: "Touch-friendly versions of most sports games are available. On-screen buttons replace keyboard inputs on mobile browsers." },
    ],
    extra: "Compete, score and climb the leaderboard in this fun sports game — no installation, just pure athletic competition in your browser.",
  },

  Strategy: {
    controls: "- Mouse to select units, buildings or tiles\n- Right-click to move or attack\n- Keyboard shortcuts for building and unit menus",
    tips: [
      "- Secure resources early; an economic advantage wins most strategy games.",
      "- Scout your opponent's base before committing to an attack strategy.",
      "- Don't spread units too thin — focus fire beats quantity attacks.",
      "- Build a mix of unit types; pure rushes are countered by even one hard-counter unit.",
    ],
    faq: [
      { question: "Is this strategy game free?", answer: "Yes, 100% free in your browser — no download, no account required." },
      { question: "How do I beat harder difficulty levels?", answer: "Focus on early economy, scout often and build tech upgrades before army size. Knowledge of the map beats raw unit numbers." },
      { question: "Can I play against other players online?", answer: "Some strategy games on this portal support async online play or hot-seat multiplayer. Check the main menu for online options." },
      { question: "Does it auto-save?", answer: "Most strategy games save to browser local storage at the start of each turn or after key events." },
      { question: "What is the best starting strategy?", answer: "Prioritize resource collection buildings in the first few turns, then invest in defenses before expanding aggressively." },
    ],
    extra: "Plan your moves, build your empire and outsmart opponents in deep strategic gameplay — all free and instantly accessible in your browser.",
  },

  Arcade: {
    controls: "- Arrow keys to move in all directions\n- Space bar or Z to shoot or perform main action\n- X for secondary action or special move",
    tips: [
      "- Learn the scoring multipliers — chaining moves without getting hit often multiplies your score.",
      "- Memorize enemy spawn patterns; arcade games are often predictable once you know the rhythm.",
      "- Use screen edges strategically — enemies can't flank from behind the borders.",
      "- Go for extra lives before power-ups when given the choice; survivability beats offense.",
    ],
    faq: [
      { question: "Is this arcade game free?", answer: "Yes, completely free. Play instantly in any modern browser — no downloads, no sign-up." },
      { question: "Is there a high score leaderboard?", answer: "Some arcade games on Gasty Games include a local or online high score table. Look for the leaderboard icon on the main screen." },
      { question: "Can I play on mobile?", answer: "Yes, with on-screen touch controls on mobile browsers. The gameplay is optimized for both desktop and mobile." },
      { question: "How do I get extra lives?", answer: "Extra lives are usually awarded for reaching score milestones or collecting life icons scattered across levels." },
      { question: "The game is too hard — any advice?", answer: "Start by focusing only on survival, not score. Once you can reliably reach stage 3, start working on scoring techniques." },
    ],
    extra: "Addictive pick-up-and-play gameplay that rewards skill and quick reflexes — a perfect arcade experience, no tokens needed.",
  },

  Platformer: {
    controls: "- Arrow keys or A/D to move left and right\n- Space, W or up arrow to jump\n- Double-tap jump for double jump (if available)\n- S or down arrow to crouch or drop through platforms",
    tips: [
      "- Coyote time is real in most platformers — you can jump just after walking off an edge.",
      "- Hold jump longer for higher jumps in games that support variable jump height.",
      "- Learn the level layout first, then optimize speed on replays.",
      "- Collect everything on the first run; backtracking for missed items costs more time.",
    ],
    faq: [
      { question: "Is this platformer free?", answer: "Yes, play for free in your browser — no download or account required." },
      { question: "How many levels are there?", answer: "Most browser platformers include 10–40 levels across multiple worlds with increasing difficulty and new mechanics." },
      { question: "Can I play on mobile?", answer: "Yes. On-screen directional buttons and a jump button replace keyboard controls on touch devices." },
      { question: "How do I beat the boss?", answer: "Each boss has an attack pattern with a safe window to hit them. Observe for one cycle, then exploit the gap on the next." },
      { question: "Are there secrets or hidden areas?", answer: "Most platformers hide bonus items behind breakable walls, above the visible area or in seemingly dead-end paths. Explore everywhere." },
    ],
    extra: "Run, jump and dash your way through challenging levels in this classic platformer — tight controls, rewarding gameplay and zero cost to play.",
  },

  Idle: {
    controls: "- Mouse click or tap to collect resources manually\n- All upgrades managed via on-screen buttons\n- Game progresses automatically even when idle",
    tips: [
      "- Prestige or reset as soon as the multiplier becomes significant — early resets compound faster.",
      "- Prioritize multiplier upgrades over flat production boosts for long-term gains.",
      "- Leave the game running in a background tab; idle games reward patience.",
      "- Read all upgrade descriptions carefully — some have hidden synergies.",
    ],
    faq: [
      { question: "Is this idle game free?", answer: "Yes, completely free. No downloads, no purchases — just open and play." },
      { question: "Does it progress when I close the tab?", answer: "Most idle games on Gasty Games calculate offline earnings when you return, rewarding you for time away." },
      { question: "Should I prestige early?", answer: "Prestige once each upgrade costs more than 30 minutes of production. Early and frequent resets grow your multiplier faster." },
      { question: "Is there an end to the game?", answer: "Many idle games are theoretically endless, with incremental goals. Others have a 'true end' unlocked after multiple prestige cycles." },
      { question: "My progress disappeared — what happened?", answer: "Progress is stored in browser local storage. Clearing browser data or using private/incognito mode will reset your save." },
    ],
    extra: "Watch your numbers grow from a trickle to an avalanche — idle games are the perfect companion for multitasking. Start small, think big.",
  },

  Horror: {
    controls: "- WASD or arrow keys to move\n- Mouse to look around and interact\n- E or F to pick up items and open doors\n- Shift to run, crouch to hide",
    tips: [
      "- Manage your resources carefully — flashlight batteries and healing items are scarce.",
      "- Crouch and walk slowly when you hear enemies; running creates noise that attracts them.",
      "- Memorize safe room locations; retreating is smarter than fighting most enemies.",
      "- Read all notes and logs — they contain puzzle solutions and enemy weaknesses.",
    ],
    faq: [
      { question: "Is this horror game free?", answer: "Yes, completely free to play in your browser. No download or sign-up required." },
      { question: "Is it too scary for kids?", answer: "Horror games contain jump scares, dark themes and frightening imagery. They are not recommended for young children or those sensitive to fear-based content." },
      { question: "Can you die in the game?", answer: "Yes — death returns you to the last checkpoint. Some horror games feature permadeath, so play carefully." },
      { question: "How do I survive encounters with monsters?", answer: "Most horror game monsters can be avoided rather than fought. Use the environment, crouch, and hold your breath or reduce movement to stay hidden." },
      { question: "Are there multiple endings?", answer: "Many horror games feature good and bad endings based on the choices you make or items you collect throughout the game." },
    ],
    extra: "Nerve-wracking atmosphere, clever scares and tense survival gameplay — play with the lights off if you dare. Free, no download needed.",
  },

  Fighting: {
    controls: "- Arrow keys to move and jump\n- A, S, D or Z, X, C for light, medium and heavy attacks\n- Combinations unlock special moves — try forward + heavy attack",
    tips: [
      "- Learn two or three reliable combos and master them before trying flashy sequences.",
      "- Blocking and counter-attacking beats raw damage output in most fighting games.",
      "- Watch your opponent's habits in round 1 — adapt your strategy for round 2.",
      "- Special moves cost stamina or meter; save them for punishing blocked attacks.",
    ],
    faq: [
      { question: "Is this fighting game free?", answer: "Yes, fully free — play directly in your browser with no download or account needed." },
      { question: "Can I play against a friend locally?", answer: "Many browser fighting games support 2-player mode on the same keyboard. Player 1 uses WASD and Player 2 uses arrow keys." },
      { question: "How do I do special moves?", answer: "Special moves usually require directional input + attack. Look for the moves list in the pause menu or character select screen." },
      { question: "How do I unlock more characters?", answer: "Complete arcade/story mode with existing characters to unlock new fighters, or meet specific in-game milestones." },
      { question: "The AI is too hard — any tips?", answer: "Switch to Easy difficulty if available, and focus entirely on defense — block, wait for an opening, then punish with your best combo." },
    ],
    extra: "Classic one-on-one combat with deep mechanics, satisfying combos and competitive edge — ready to fight? It's free, right in your browser.",
  },
};

// Default for unknown categories
const DEFAULT_TEMPLATE: CategoryTemplate = {
  controls: "- Mouse click or tap to interact\n- Arrow keys or WASD to move\n- Space bar for primary action\n- Escape or P to pause",
  tips: [
    "- Take your time to understand the game's core mechanic before rushing.",
    "- Explore every corner of each level — hidden bonuses are often out of plain sight.",
    "- Retry difficult sections with a focus on one improvement at a time.",
    "- Check the pause menu or settings for difficulty options if the game feels too hard.",
  ],
  faq: [
    { question: "Is this game free to play?", answer: "Yes, 100% free — no download, no account, no payment. Open your browser and play instantly." },
    { question: "Does it work on mobile?", answer: "Yes. The game uses HTML5 and runs on Chrome, Safari and Firefox on Android and iOS devices." },
    { question: "How do I save my progress?", answer: "Progress auto-saves to your browser's local storage. Avoid clearing browser data to keep your save file." },
    { question: "Can I play with a friend?", answer: "Some modes support local 2-player on the same device. Check the main menu for multiplayer or co-op options." },
    { question: "The game is lagging — what can I do?", answer: "Close other browser tabs to free up memory, or try a different browser. Chrome generally provides the best performance for HTML5 games." },
  ],
  extra: "A fun, engaging browser game playable for free with no installation required — dive in and enjoy!",
};

// ── Public API ────────────────────────────────────────────────────────────────

export type BuiltGameContent = {
  longDescription: string;
  controls: string;
  tips: string;
  faqJson: string;
};

function getTemplate(category: string): CategoryTemplate {
  // Normalize: "Tower Defense" → try exact match, then first-word match
  const exact = TEMPLATES[category];
  if (exact) return exact;

  const firstWord = category.split(/[\s/]/)[0];
  const partial = Object.entries(TEMPLATES).find(([k]) =>
    k.toLowerCase().includes(firstWord.toLowerCase()) ||
    firstWord.toLowerCase().includes(k.toLowerCase()),
  );

  return partial?.[1] ?? DEFAULT_TEMPLATE;
}

export function buildGameContent(game: {
  title: string;
  description: string;
  category: string;
  tags: string;
}): BuiltGameContent {
  const tpl = getTemplate(game.category);

  // longDescription: use existing description as base.
  // If it's rich enough (300+ chars), use it directly.
  // Otherwise append the category "extra" paragraph.
  const base = game.description.trim();
  const longDescription =
    base.length >= 300
      ? base
      : base
      ? `${base}\n\n${tpl.extra}`
      : `${game.title} is a free HTML5 ${game.category.toLowerCase()} game you can play instantly in your browser.\n\n${tpl.extra}`;

  // Personalise FAQ with game title
  const faq = tpl.faq.map((item) => ({
    question: item.question.replace("this game", game.title).replace("this", game.title),
    answer: item.answer,
  }));

  return {
    longDescription: longDescription.slice(0, 5000),
    controls: tpl.controls,
    tips: tpl.tips.join("\n"),
    faqJson: JSON.stringify(faq),
  };
}
