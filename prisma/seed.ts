import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { DEFAULT_GAMES } from "../src/data/defaultGames";
import { slugify } from "../src/lib/game-schema";

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

function resolveSqlitePath(url: string) {
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL precisa usar SQLite com formato file:./dev.db");
  }

  const rawPath = url.slice("file:".length);
  return rawPath.startsWith("/") ? rawPath : `${process.cwd()}/${rawPath.replace(/^\.\//, "")}`;
}

function createPrismaClient() {
  if (tursoUrl) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaBetterSqlite3({
    url: resolveSqlitePath(databaseUrl),
  });

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

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