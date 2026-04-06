import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { DEFAULT_GAMES } from "../src/data/defaultGames";
import { slugify } from "../src/lib/game-schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function resolveSqlitePath(url: string) {
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL precisa usar SQLite com formato file:./dev.db");
  }

  const rawPath = url.slice("file:".length);
  return rawPath.startsWith("/") ? rawPath : `${process.cwd()}/${rawPath.replace(/^\.\//, "")}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(databaseUrl),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.game.count();

  if (count > 0) {
    console.log("Seed ignorado: a tabela Game já possui registros.");
    return;
  }

  await prisma.game.createMany({
    data: DEFAULT_GAMES.map((game) => ({
      ...game,
      slug: slugify(game.title),
      tags: game.tags.join(","),
      isPublished: true,
    })),
  });

  console.log(`Seed concluído com ${DEFAULT_GAMES.length} jogos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });