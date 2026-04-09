import { createClient } from "@libsql/client";
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
    console.log("🧹 Removendo todos os jogos do banco de dados Turso...");
    
    // Deleta os jogos. As tabelas relacionadas (Favoritos, Histórico, Comentários) 
    // devem ser limpas via Cascade se o Prisma estiver configurado, 
    // ou limpamos manualmente aqui se necessário.
    
    const result = await client.execute("DELETE FROM Game");
    
    console.log(`✅ Sucesso! Todos os jogos foram removidos. (${result.rowsAffected} linhas afetadas)`);
  } catch (error) {
    console.error("❌ Falha ao limpar banco de dados:", error);
    process.exit(1);
  }
}

main();
