import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não configurado no .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  try {
    const filePath = path.join(process.cwd(), "prisma/schema.sql");
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const schemaSql = fs.readFileSync(filePath, "utf8");
    console.log(`📄 Arquivo lido. Tamanho: ${schemaSql.length} bytes`);
    
    // Divide por ponto e vírgula, mas lida melhor com comentários e espaços
    const statements = schemaSql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`🚀 Iniciando deploy de ${statements.length} comandos SQL no Turso...`);

    if (statements.length === 0) {
      console.log("⚠️ Nenhum comando encontrado para executar.");
      return;
    }

    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      process.stdout.write(`Executing [${i+1}/${statements.length}]... `);
      try {
        await client.execute(sql);
        console.log("✅");
      } catch (err) {
        console.log("❌");
        console.error(`Erro no comando: ${sql}`);
        throw err;
      }
    }

    console.log("✨ Banco de dados sincronizado com sucesso no Turso!");
  } catch (error) {
    console.error("❌ Falha crítica ao sincronizar banco de dados:", error);
    process.exit(1);
  }
}

main();
