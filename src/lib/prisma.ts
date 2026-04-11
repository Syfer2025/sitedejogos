import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// Supabase Connection String (from .env) - Cleaned of any accidental whitespace/newlines
const connectionString = process.env.DATABASE_URL?.trim().replace(/\\n/g, "");

// Limit pool size to avoid exhausting Supabase connection quota.
// Vercel serverless spins multiple instances simultaneously; each instance
// gets its own pool, so keep max low (3-5 per instance is enough).
const pool = new Pool({
  connectionString,
  max: 5,
  min: 0,              // release idle connections — critical for serverless
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}