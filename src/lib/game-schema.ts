import { z } from "zod";

function coerceTags(value: string | string[] | undefined) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export const createGameInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  iframeUrl: z.string().trim().url("Informe uma URL válida."),
  thumbnail: z.string().trim().url("Informe uma URL válida."),
  description: z.string().trim().max(5000).default(""),
  category: z.string().trim().max(60).default(""),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(coerceTags),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const updateGameInputSchema = createGameInputSchema.partial().extend({
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(coerceTags),
});

export type CreateGameInput = z.infer<typeof createGameInputSchema>;
export type UpdateGameInput = z.infer<typeof updateGameInputSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}