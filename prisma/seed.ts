import "dotenv/config";
import { prisma } from "../src/lib/prisma";

import { DEFAULT_GAMES } from "../src/data/defaultGames";
import { slugify } from "../src/lib/game-schema";

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