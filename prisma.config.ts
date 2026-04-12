import { defineConfig } from "prisma/config";

const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
