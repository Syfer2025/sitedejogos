import { NextRequest } from "next/server";

const adminRouteMocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createGame: vi.fn(),
  deleteGame: vi.fn(),
  getAdminSessionFromRequest: vi.fn(),
  getGameById: vi.fn(),
  getGameBySlug: vi.fn(),
  listGames: vi.fn(),
  syncGameMonetizeFeedPages: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  getAdminSessionFromRequest: adminRouteMocks.getAdminSessionFromRequest,
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: adminRouteMocks.consumeRateLimit,
}));

vi.mock("@/data/gamesStore", () => ({
  createGame: adminRouteMocks.createGame,
  deleteGame: adminRouteMocks.deleteGame,
  getGameById: adminRouteMocks.getGameById,
  getGameBySlug: adminRouteMocks.getGameBySlug,
  listGames: adminRouteMocks.listGames,
  updateGame: adminRouteMocks.updateGame,
}));

vi.mock("@/data/gameFeedImport", () => ({
  syncGameMonetizeFeedPages: adminRouteMocks.syncGameMonetizeFeedPages,
}));

import { GET as collectionGet, POST as collectionPost } from "@/app/api/admin/games/route";
import { POST as feedSyncPost } from "@/app/api/admin/games/sync/gamemonetize/route";
import {
  DELETE as detailDelete,
  GET as detailGet,
  PUT as detailPut,
} from "@/app/api/admin/games/[id]/route";
import { GET as slugGet } from "@/app/api/admin/games/slug/[slug]/route";

function createNextRequest(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("admin games routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminRouteMocks.consumeRateLimit.mockReturnValue({
      ok: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    adminRouteMocks.getAdminSessionFromRequest.mockResolvedValue({ id: "admin-1" });
  });

  it("bloqueia listagem sem sessão admin", async () => {
    adminRouteMocks.getAdminSessionFromRequest.mockResolvedValue(null);

    const response = await collectionGet(createNextRequest("http://localhost/api/admin/games") as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("lista jogos aplicando filtros do painel admin", async () => {
    adminRouteMocks.listGames.mockResolvedValue([{ id: "game-1", title: "Game" }]);

    const response = await collectionGet(
      createNextRequest(
        "http://localhost/api/admin/games?q=drift&category=Racing&featured=true&published=false&sort=popular",
      ) as never,
    );

    expect(response.status).toBe(200);
    expect(adminRouteMocks.listGames).toHaveBeenCalledWith({
      category: "Racing",
      query: "drift",
      featured: true,
      published: false,
      sortBy: "popular",
    });
  });

  it("retorna 429 quando a criação admin excede o rate limit", async () => {
    adminRouteMocks.consumeRateLimit.mockReturnValue({ ok: false });

    const response = await collectionPost(
      createNextRequest("http://localhost/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Game" }),
      }) as never,
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Muitas operações em sequência. Aguarde alguns instantes.",
    });
  });

  it("cria jogo com payload válido", async () => {
    adminRouteMocks.createGame.mockResolvedValue({ id: "game-1", title: "Game" });

    const response = await collectionPost(
      createNextRequest("http://localhost/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quantum Drift",
          iframeUrl: "https://example.com/game",
          thumbnail: "https://example.com/thumb.png",
          description: "Arcade futurista",
          category: "Racing",
          tags: "drift,arcade",
          featured: true,
          isPublished: true,
        }),
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(adminRouteMocks.createGame).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Quantum Drift",
        category: "Racing",
        featured: true,
        tags: ["drift", "arcade"],
      }),
    );
  });

  it("retorna 404 quando o jogo do detalhe não existe", async () => {
    adminRouteMocks.getGameById.mockResolvedValue(null);

    const response = await detailGet(
      createNextRequest("http://localhost/api/admin/games/game-1") as never,
      { params: Promise.resolve({ id: "game-1" }) } as never,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("valida payload antes de atualizar jogo", async () => {
    const response = await detailPut(
      createNextRequest("http://localhost/api/admin/games/game-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbnail: "url-invalida",
        }),
      }) as never,
      { params: Promise.resolve({ id: "game-1" }) } as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Informe uma URL válida.",
    });
    expect(adminRouteMocks.updateGame).not.toHaveBeenCalled();
  });

  it("remove jogo existente", async () => {
    adminRouteMocks.deleteGame.mockResolvedValue({ id: "game-1" });

    const response = await detailDelete(
      createNextRequest("http://localhost/api/admin/games/game-1", {
        method: "DELETE",
      }) as never,
      { params: Promise.resolve({ id: "game-1" }) } as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("busca jogo por slug no endpoint auxiliar admin", async () => {
    adminRouteMocks.getGameBySlug.mockResolvedValue({ id: "game-1", slug: "quantum-drift" });

    const response = await slugGet(
      createNextRequest("http://localhost/api/admin/games/slug/quantum-drift") as never,
      { params: Promise.resolve({ slug: "quantum-drift" }) } as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "game-1",
      slug: "quantum-drift",
    });
  });

  it("bloqueia sincronização do feed sem sessão admin", async () => {
    adminRouteMocks.getAdminSessionFromRequest.mockResolvedValue(null);

    const response = await feedSyncPost(
      createNextRequest("http://localhost/api/admin/games/sync/gamemonetize", {
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("sincroniza o feed GameMonetize pelo endpoint admin", async () => {
    adminRouteMocks.syncGameMonetizeFeedPages.mockResolvedValue({
      source: "gamemonetize",
      startPage: 2,
      pageCount: 2,
      totalFetched: 4000,
      totalPrepared: 3998,
      created: 3995,
      updated: 2,
      skipped: 3,
      results: [
        {
          page: 2,
          totalFetched: 2000,
          totalPrepared: 1999,
          created: 1998,
          updated: 1,
          skipped: 1,
        },
        {
          page: 3,
          totalFetched: 2000,
          totalPrepared: 1999,
          created: 1997,
          updated: 1,
          skipped: 2,
        },
      ],
    });

    const response = await feedSyncPost(
      createNextRequest("http://localhost/api/admin/games/sync/gamemonetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 2, pages: 2, maxItems: 0 }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(adminRouteMocks.syncGameMonetizeFeedPages).toHaveBeenCalledWith({
      page: 2,
      pages: 2,
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        source: "gamemonetize",
        created: 3995,
        pageCount: 2,
      }),
    );
  });

  it("valida o payload do sync do feed", async () => {
    const response = await feedSyncPost(
      createNextRequest("http://localhost/api/admin/games/sync/gamemonetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 0 }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Too small: expected number to be >=1",
    });
    expect(adminRouteMocks.syncGameMonetizeFeedPages).not.toHaveBeenCalled();
  });
});