import { spawnSync } from "node:child_process";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("🚀 Gasty Games - AdSense Vercel Configurator\n");
  
  const clientId = await question("Qual o seu AdSense Publisher ID? (ca-pub-XXXXXXXX): ");
  if (!clientId || !clientId.startsWith("ca-pub-")) {
    console.error("❌ ID inválido. Deve começar com ca-pub-");
    process.exit(1);
  }

  const slotId = await question("Qual o ID do Bloco de Anúncio principal (Home/General Slot)? ");
  
  const vars = {
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: clientId,
    NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP: slotId,
    NEXT_PUBLIC_ADSENSE_SLOT_HOME_MIDDLE: slotId,
    NEXT_PUBLIC_ADSENSE_SLOT_HOME_CONTENT: slotId,
    NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP: slotId,
    NEXT_PUBLIC_ADSENSE_SLOT_GAME_BOTTOM: slotId,
    NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: slotId,
  };

  console.log("\n📡 Configurando variáveis na Vercel...");

  for (const [key, value] of Object.entries(vars)) {
    console.log(`Setting ${key}...`);
    spawnSync("npx", ["vercel", "env", "add", key, "production"], {
      input: value,
      encoding: "utf-8",
    });
  }

  console.log("\n✅ Todas as variáveis foram adicionadas!");
  console.log("💡 Dica: Agora rode 'npx vercel --prod' para aplicar as mudanças ao site ao vivo.");
  rl.close();
}

main();
