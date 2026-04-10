import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { syncGameMonetizeFeedPages } from "@/data/gameFeedImport";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

const syncPayloadSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  pages: z.coerce.number().int().min(1).max(10).default(1),
  maxItems: z.coerce.number().int().min(0).max(2000).default(0),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncLimit = consumeRateLimit(`admin-feed-sync:${session.id}`, {
    limit: 6,
    windowMs: 30 * 60 * 1000,
  });

  if (!syncLimit.ok) {
    return NextResponse.json(
      { error: "Muitas sincronizações em sequência. Aguarde alguns minutos." },
      { status: 429 },
    );
  }

  try {
    const parsed = syncPayloadSchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
        { status: 400 },
      );
    }

    const result = await syncGameMonetizeFeedPages({
      page: parsed.data.page,
      pages: parsed.data.pages,
      ...(parsed.data.maxItems > 0 ? { maxItems: parsed.data.maxItems } : {}),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Sync Error]:", error);
    return NextResponse.json(
      { 
        error: "Erro ao sincronizar feed da GameMonetize.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}