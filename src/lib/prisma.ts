import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";
const PROJECT_ROOT = process.env.npm_package_json
  ? path.dirname(process.env.npm_package_json)
  : process.cwd();
const DEFAULT_SQLITE_PATH = path.join(PROJECT_ROOT, "dev.db");

function resolveSqlitePath(databaseUrl: string) {
  if (databaseUrl === "file:./dev.db") {
    return DEFAULT_SQLITE_PATH;
  }

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL precisa usar o formato file: para SQLite.");
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.join(/* turbopackIgnore: true */ PROJECT_ROOT, rawPath);
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient | { $disconnect?: () => Promise<void> };
};

const REQUIRED_PRISMA_DELEGATES = [
  "game",
  "adminSession",
  "playerUser",
  "playerSession",
  "favoriteGame",
  "recentlyPlayed",
  "analyticsEvent",
  "playerAchievement",
  "achievementDefinition",
  "blogPost",
  "playerNotification",
  "playerDailyMission",
] as const;

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: resolveSqlitePath(DATABASE_URL),
  });

  return new PrismaClient({ adapter });
}

function hasAllExpectedDelegates(
  client: unknown,
): client is PrismaClient {
  if (!client || typeof client !== "object") {
    return false;
  }

  return REQUIRED_PRISMA_DELEGATES.every((delegateName) => {
    const delegate = Reflect.get(client, delegateName);
    return delegate !== undefined;
  });
}

function disconnectStaleClient(client: unknown) {
  if (!client || typeof client !== "object") {
    return;
  }

  const disconnect = Reflect.get(client, "$disconnect");

  if (typeof disconnect === "function") {
    void Promise.resolve(disconnect.call(client)).catch(() => undefined);
  }
}

function resolvePrismaClient(): PrismaClient {
  const cachedClient = globalForPrisma.prisma;

  if (hasAllExpectedDelegates(cachedClient)) {
    return cachedClient;
  }

  disconnectStaleClient(cachedClient);

  const nextClient = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = nextClient;
  }

  return nextClient;
}

function createPrismaClientProxy(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, property) {
      const client = resolvePrismaClient();
      const value = Reflect.get(client, property, client);

      return typeof value === "function" ? value.bind(client) : value;
    },
    has(_target, property) {
      return property in resolvePrismaClient();
    },
    ownKeys() {
      return Reflect.ownKeys(resolvePrismaClient());
    },
    getOwnPropertyDescriptor(_target, property) {
      const client = resolvePrismaClient();
      const descriptor = Reflect.getOwnPropertyDescriptor(client, property);

      if (descriptor) {
        return descriptor;
      }

      return {
        configurable: true,
        enumerable: true,
        writable: false,
        value: undefined,
      };
    },
  });
}

export const prisma = createPrismaClientProxy();