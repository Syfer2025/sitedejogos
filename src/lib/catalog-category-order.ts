export type CatalogCategoryOrderMode = "alphabetical" | "editorial";

const EDITORIAL_CATEGORY_PRIORITY = [
  "action",
  "puzzle",
  "racing",
  "sports",
  "shooting",
  "adventure",
  "arcade",
  "hypercasual",
  "multiplayer",
  "strategy",
  "rpg",
  "3d",
  "simulation",
  "music",
  "girls",
  "boys",
  "educational",
  "card",
  "board",
  "clicker",
  "soccer",
  "stickman",
] as const;

const EDITORIAL_PRIORITY_INDEX = new Map(
  EDITORIAL_CATEGORY_PRIORITY.map((category, index) => [category, index]),
);

export function normalizeCatalogCategoryKey(category: string) {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function sortCatalogCategories(
  categories: string[],
  options: {
    mode?: CatalogCategoryOrderMode;
    counts?: Map<string, number>;
  } = {},
) {
  const mode = options.mode ?? "alphabetical";
  const counts = options.counts;

  return [...categories].sort((left, right) => {
    const leftKey = normalizeCatalogCategoryKey(left);
    const rightKey = normalizeCatalogCategoryKey(right);

    if (mode === "editorial") {
      const leftPriority = EDITORIAL_PRIORITY_INDEX.get(leftKey);
      const rightPriority = EDITORIAL_PRIORITY_INDEX.get(rightKey);

      if (leftPriority !== undefined || rightPriority !== undefined) {
        if (leftPriority === undefined) {
          return 1;
        }

        if (rightPriority === undefined) {
          return -1;
        }

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
      }
    }

    if (counts) {
      const leftCount = counts.get(left) ?? 0;
      const rightCount = counts.get(right) ?? 0;

      if (rightCount !== leftCount) {
        return rightCount - leftCount;
      }
    }

    return left.localeCompare(right, "pt-BR");
  });
}