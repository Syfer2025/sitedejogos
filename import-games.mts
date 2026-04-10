import { prisma } from './src/lib/prisma';

function generateSlug(title: string, hash: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  return `${base}-${hash.substring(0, 6)}`;
}

async function main() {
  const amount = 200;
  const targetUrl = `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=popular&categories=All&type=all&amount=${amount}&format=json`;
  console.log(`[Game Sync] Fetching catalog from: ${targetUrl}`);

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error("Failed to fetch from GameDistribution API");
  }

  const feed = await res.json();
  if (!Array.isArray(feed)) {
    throw new Error("Invalid feed format");
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
    const tagsArr = Array.isArray(item.Tag) ? item.Tag : [];
    const tags = tagsArr.join(",");

    // Filtro de Qualidade: Descrição rica e tags mínimas
    if (description.length < 200 || tagsArr.length < 3) {
      console.log(`[Skip] ${title} - Metadados insuficientes (Desc: ${description.length}, Tags: ${tagsArr.length})`);
      continue;
    }

    const existingGame = await prisma.game.findFirst({
      where: {
        externalSource: "gamedistribution",
        externalId: extId
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
          featured: Math.random() > 0.8,
          views: Math.floor(Math.random() * 1000), 
        }
      });
      createdCount++;
    }
  }

  console.log(`Success! Fetched: ${feed.length}, Created: ${createdCount}, Updated: ${updatedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
