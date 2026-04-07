import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

function generateSlug(title: string, hash: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  return `${base}-${hash.substring(0, 6)}`;
}

export async function POST(req: NextRequest) {
  // Authentication
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const amount = body.amount ? parseInt(body.amount, 10) : 50;

    const targetUrl = `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=All&type=all&amount=${amount}&format=json`;
    console.log(`[Game Sync] Fetching catalog from: ${targetUrl}`);

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from GameDistribution API" }, { status: 502 });
    }

    const feed = await res.json();
    if (!Array.isArray(feed)) {
      return NextResponse.json({ error: "Invalid feed format" }, { status: 500 });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of feed) {
      const extId = item.Md5;
      if (!extId) continue;

      const title = item.Title || "Untitled Game";
      const iframeUrl = item.Url;
      const thumbnail = (item.Asset && item.Asset[1]) || (item.Asset && item.Asset[0]) || "";
      const description = item.Description || "";
      
      const rawCat = Array.isArray(item.Category) && item.Category[0] ? item.Category[0] : "Arcade";
      const category = rawCat === "Action" ? "Ação" : rawCat === "Racing" ? "Corrida" : rawCat;
      const tags = Array.isArray(item.Tag) ? item.Tag.join(",") : "";

      const existingGame = await prisma.game.findUnique({
        where: {
          externalSource_externalId: {
            externalSource: "gamedistribution",
            externalId: extId
          }
        }
      });

      if (existingGame) {
        await prisma.game.update({
          where: { id: existingGame.id },
          data: {
            title,
            iframeUrl,
            thumbnail,
            description,
            category,
            tags,
          }
        });
        updatedCount++;
      } else {
        const slug = generateSlug(title, extId);
        await prisma.game.create({
          data: {
            title,
            slug,
            iframeUrl,
            thumbnail,
            description,
            category,
            tags,
            externalSource: "gamedistribution",
            externalId: extId,
            isPublished: true,
            featured: false,
            views: Math.floor(Math.random() * 1000), // Start with some fake popularity
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        fetched: feed.length,
        created: createdCount,
        updated: updatedCount,
      }
    });
  } catch (error: any) {
    console.error("[Game Sync] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
