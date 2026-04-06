import { z } from "zod";

import { isOptionalSupportedImageReference } from "@/lib/media";

export const MAX_PROFILE_CATEGORY_COUNT = 4;

export function normalizePreferredCategories(
  value: string | string[] | undefined,
) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];

  return Array.from(
    new Set(source.map((item) => item.trim()).filter(Boolean)),
  ).slice(0, MAX_PROFILE_CATEGORY_COUNT);
}

export function serializePreferredCategories(
  value: string | string[] | undefined,
) {
  return normalizePreferredCategories(value).join(",");
}

export const playerLoginSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const playerRegisterSchema = playerLoginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(40, "O nome deve ter no máximo 40 caracteres."),
});

export const playerProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(40, "O nome deve ter no máximo 40 caracteres.")
    .optional(),
  avatarUrl: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value.trim()))
    .refine(isOptionalSupportedImageReference, "Informe uma imagem válida para o avatar."),
  bio: z
    .string()
    .trim()
    .max(240, "A bio deve ter no máximo 240 caracteres.")
    .optional(),
  preferredCategories: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : normalizePreferredCategories(value),
    ),
});

export type PlayerLoginInput = z.infer<typeof playerLoginSchema>;
export type PlayerRegisterInput = z.infer<typeof playerRegisterSchema>;
export type PlayerProfileUpdateInput = z.infer<
  typeof playerProfileUpdateSchema
>;