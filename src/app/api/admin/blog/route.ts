import { NextRequest, NextResponse } from "next/server";

import { createBlogPost, listAdminBlogPosts } from "@/data/blogPosts";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { createBlogPostInputSchema } from "@/lib/blog-schema";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await listAdminBlogPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
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
  const parsed = createBlogPostInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  try {
    const post = await createBlogPost(parsed.data);
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar o post agora." },
      { status: 500 },
    );
  }
}
