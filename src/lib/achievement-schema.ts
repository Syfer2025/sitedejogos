import { z } from "zod";

import { ACHIEVEMENT_CRITERIA_TYPES } from "@/lib/gamification";
import { isOptionalSupportedImageReference } from "@/lib/media";

const achievementKeySchema = z
  .string()
  .trim()
  .min(2, "A chave precisa ter pelo menos 2 caracteres.")
  .max(60, "A chave precisa ter no máximo 60 caracteres.")
  .regex(/^[a-z0-9-]+$/i, "Use apenas letras, números e hífen na chave.");

const optionalImageReferenceSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value?.trim() ?? "")
  .refine(isOptionalSupportedImageReference, "Informe uma imagem válida.");

export const achievementCriteriaTypeSchema = z.enum(ACHIEVEMENT_CRITERIA_TYPES);

export const createAchievementDefinitionInputSchema = z.object({
  key: achievementKeySchema.optional(),
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres.").max(80),
  description: z
    .string()
    .trim()
    .min(8, "A descrição precisa ter pelo menos 8 caracteres.")
    .max(240),
  icon: z.string().trim().max(8, "O ícone pode ter no máximo 8 caracteres.").optional().default(""),
  imageUrl: optionalImageReferenceSchema,
  criteriaType: achievementCriteriaTypeSchema,
  threshold: z.coerce
    .number()
    .int("Use um alvo inteiro.")
    .min(1, "O alvo mínimo é 1.")
    .max(99999, "O alvo máximo é 99999."),
  xpReward: z.coerce
    .number()
    .int("Use um XP inteiro.")
    .min(0, "O XP mínimo é 0.")
    .max(100000, "O XP máximo é 100000."),
  isActive: z.coerce.boolean().default(true),
});

export const updateAchievementDefinitionInputSchema = createAchievementDefinitionInputSchema.partial();

export type CreateAchievementDefinitionInput = z.infer<
  typeof createAchievementDefinitionInputSchema
>;
export type UpdateAchievementDefinitionInput = z.infer<
  typeof updateAchievementDefinitionInputSchema
>;