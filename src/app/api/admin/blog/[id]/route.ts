import { NextRequest, NextResponse } from "next/server";

import { deleteBlogPost, updateBlogPost } from "@/data/blogPosts";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { updateBlogPostInputSchema } from "@/lib/blog-schema";
import { consumeRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-blog-write:${session.id}`, {
    limit: 40,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateBlogPostInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const post = await updateBlogPost(id, parsed.data);

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeLimit = consumeRateLimit(`admin-blog-write:${session.id}`, {
    limit: 40,
    windowMs: 5 * 60 * 1000,
  });

  if (!writeLimit.ok) {
    return NextResponse.json(
      { error: "Muitas operações em sequência. Aguarde alguns instantes." },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const post = await deleteBlogPost(id);

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
