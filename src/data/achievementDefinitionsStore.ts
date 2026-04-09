import { prisma } from "@/lib/prisma";
import type {
  CreateAchievementDefinitionInput,
  UpdateAchievementDefinitionInput,
} from "@/lib/achievement-schema";
import {
  DEFAULT_ACHIEVEMENT_DEFINITIONS,
  type AchievementCriteriaType,
} from "@/lib/gamification";
import { slugify } from "@/lib/game-schema";

const DEFAULT_ACHIEVEMENT_DEFINITION_BY_KEY = new Map(
  DEFAULT_ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export type AchievementDefinitionRecord = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  criteriaType: AchievementCriteriaType;
  threshold: number;
  xpReward: number;
  coinReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapAchievementDefinition(definition: {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  criteriaType: string;
  threshold: number;
  xpReward: number;
  coinReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AchievementDefinitionRecord {
  const defaultDefinition = DEFAULT_ACHIEVEMENT_DEFINITION_BY_KEY.get(definition.key);

  return {
    id: definition.id,
    key: definition.key,
    title: definition.title,
    description: definition.description,
    icon: definition.icon || defaultDefinition?.icon || "",
    imageUrl: definition.imageUrl || defaultDefinition?.imageUrl || "",
    criteriaType: definition.criteriaType as AchievementCriteriaType,
    threshold: definition.threshold,
    xpReward: definition.xpReward,
    coinReward: definition.coinReward,
    isActive: definition.isActive,
    createdAt: definition.createdAt.toISOString(),
    updatedAt: definition.updatedAt.toISOString(),
  };
}

function resolveAchievementKey(input: Pick<CreateAchievementDefinitionInput, "key" | "title">) {
  if (input.key?.trim()) {
    return slugify(input.key.trim());
  }

  return slugify(input.title.trim());
}

async function makeUniqueAchievementKey(
  input: Pick<CreateAchievementDefinitionInput, "key" | "title">,
  currentId?: string,
) {
  const baseKey = resolveAchievementKey(input) || "conquista";
  let nextKey = baseKey;
  let counter = 1;

  while (
    await prisma.achievementDefinition.findFirst({
      where: {
        key: nextKey,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    })
  ) {
    nextKey = `${baseKey}-${counter++}`;
  }

  return nextKey;
}

export async function ensureDefaultAchievementDefinitions() {
  const existingDefinitions = await prisma.achievementDefinition.findMany({
    select: { key: true },
  });

  const existingKeys = new Set(existingDefinitions.map((definition) => definition.key));
  const missingDefinitions = DEFAULT_ACHIEVEMENT_DEFINITIONS.filter(
    (definition) => !existingKeys.has(definition.key),
  );

  if (missingDefinitions.length === 0) {
    return;
  }

  await prisma.achievementDefinition.createMany({
    data: missingDefinitions,
  });
}

export async function listAchievementDefinitions(options?: { includeInactive?: boolean }) {
  await ensureDefaultAchievementDefinitions();

  const definitions = await prisma.achievementDefinition.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ isActive: "desc" }, { xpReward: "desc" }, { createdAt: "asc" }],
  });

  return definitions.map(mapAchievementDefinition);
}

export async function getAchievementDefinitionById(id: string) {
  await ensureDefaultAchievementDefinitions();

  const definition = await prisma.achievementDefinition.findUnique({ where: { id } });
  return definition ? mapAchievementDefinition(definition) : null;
}

export async function createAchievementDefinition(input: CreateAchievementDefinitionInput) {
  await ensureDefaultAchievementDefinitions();
  const key = await makeUniqueAchievementKey(input);

  const definition = await prisma.achievementDefinition.create({
    data: {
      key,
      title: input.title.trim(),
      description: input.description.trim(),
      icon: input.icon?.trim() ?? "",
      imageUrl: input.imageUrl?.trim() ?? "",
      criteriaType: input.criteriaType,
      threshold: input.threshold,
      xpReward: input.xpReward,
      coinReward: input.coinReward,
      isActive: input.isActive,
    },
  });

  return mapAchievementDefinition(definition);
}

export async function updateAchievementDefinition(
  id: string,
  input: UpdateAchievementDefinitionInput,
) {
  await ensureDefaultAchievementDefinitions();

  const nextKey =
    input.key !== undefined || input.title !== undefined
      ? await makeUniqueAchievementKey(
          {
            key: input.key,
            title: input.title ?? input.key ?? "conquista",
          },
          id,
        )
      : undefined;

  try {
    const definition = await prisma.achievementDefinition.update({
      where: { id },
      data: {
        ...(nextKey ? { key: nextKey } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() } : {}),
        ...(input.criteriaType !== undefined ? { criteriaType: input.criteriaType } : {}),
        ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
        ...(input.xpReward !== undefined ? { xpReward: input.xpReward } : {}),
        ...(input.coinReward !== undefined ? { coinReward: input.coinReward } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    return mapAchievementDefinition(definition);
  } catch {
    return null;
  }
}

export async function deleteAchievementDefinition(id: string) {
  await ensureDefaultAchievementDefinitions();

  try {
    const definition = await prisma.achievementDefinition.delete({ where: { id } });
    return mapAchievementDefinition(definition);
  } catch {
    return null;
  }
}