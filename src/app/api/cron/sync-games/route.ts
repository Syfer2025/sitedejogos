import { NextRequest, NextResponse } from "next/server";
import { syncGameMonetizeFeedPages } from "@/data/gameFeedImport";

export async function GET(req: NextRequest) {
  // Use Vercel's authorization token mechanism or a backup query param
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized = authHeader === `Bearer ${cronSecret}` || req.nextUrl.searchParams.get("cron_secret") === cronSecret;

  if (process.env.NODE_ENV === "production" && !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Sincroniza 2 páginas (aprox 60-100 jogos novos) todo dia na madruga.
    const result = await syncGameMonetizeFeedPages({
      page: 1,
      pages: 2,
    });

    return NextResponse.json({
      success: true,
      message: "Cron job finalizado com sucesso.",
      data: result,
    });
  } catch (error: any) {
    console.error("[Cron Sync] Error:", error);
    return NextResponse.json(
      { error: "Falha na sincronização automatizada." },
      { status: 500 },
    );
  }
}
