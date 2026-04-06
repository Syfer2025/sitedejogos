import { z } from "zod";

const blogCoverImageSchema = z
  .string()
  .trim()
  .max(240)
  .refine(
    (value) => !value || value.startsWith("/") || /^https?:\/\//.test(value),
    "Envie uma URL válida ou faça upload da imagem de capa.",
  )
  .optional()
  .default("");

export const createBlogPostInputSchema = z.object({
  slug: z.string().trim().max(120).optional(),
  title: z.string().trim().min(4, "Informe um título com pelo menos 4 caracteres.").max(160),
  category: z.string().trim().min(2, "Informe uma categoria.").max(60),
  coverImageUrl: blogCoverImageSchema,
  excerpt: z.string().trim().max(240).optional().default(""),
  content: z.string().trim().min(40, "O conteúdo precisa ter pelo menos 40 caracteres."),
  isPublished: z.coerce.boolean().default(false),
});

export const updateBlogPostInputSchema = createBlogPostInputSchema.partial();

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;