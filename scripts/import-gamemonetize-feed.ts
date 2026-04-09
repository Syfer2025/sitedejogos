import "dotenv/config";
import { syncGameMonetizeFeedPages } from "../src/data/gameFeedImport";
import { prisma } from "../src/lib/prisma";

function readNumberFlag(flagName: string, fallbackValue: number) {
  const rawFlag = process.argv.find((argument) => argument.startsWith(`${flagName}=`));

  if (!rawFlag) {
    return fallbackValue;
  }

  const parsedValue = Number(rawFlag.split("=")[1]);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

async function main() {
  const startPage = readNumberFlag("--page", 1);
  const totalPages = readNumberFlag("--pages", 1);
  const maxItems = readNumberFlag("--max-items", 0);

  const result = await syncGameMonetizeFeedPages({
    page: startPage,
    pages: totalPages,
    ...(maxItems > 0 ? { maxItems } : {}),
  });

  for (const pageResult of result.results) {
    console.log(
      `[GameMonetize] página ${pageResult.page}: ${pageResult.created} criados, ${pageResult.updated} atualizados, ${pageResult.skipped} ignorados (${pageResult.totalFetched} itens lidos).`,
    );
  }

  console.log(
    `[GameMonetize] sincronização concluída: ${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados em ${result.totalFetched} item(ns) de feed.`,
  );
}

main()
  .catch((error) => {
    console.error("[GameMonetize] falha na importação:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });