const profileMocks = vi.hoisted(() => ({
  applyGamificationEvent: vi.fn(),
  getPlayerProfile: vi.fn(),
  getPlayerSessionFromRequest: vi.fn(),
  listCategories: vi.fn(),
  updatePlayerProfile: vi.fn(),
}));

vi.mock("@/lib/user-auth", () => ({
  getPlayerSessionFromRequest: profileMocks.getPlayerSessionFromRequest,
}));

vi.mock("@/data/gamesStore", () => ({
  listCategories: profileMocks.listCategories,
}));

vi.mock("@/data/gamificationStore", () => ({
  applyGamificationEvent: profileMocks.applyGamificationEvent,
}));

vi.mock("@/data/playerStore", () => ({
  getPlayerProfile: profileMocks.getPlayerProfile,
  updatePlayerProfile: profileMocks.updatePlayerProfile,
}));

import { GET, PATCH } from "@/app/api/user/profile/route";

describe("player profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.applyGamificationEvent.mockResolvedValue(undefined);
  });

  it("bloqueia leitura sem sessão ativa", async () => {
    profileMocks.getPlayerSessionFromRequest.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/user/profile") as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("atualiza o perfil filtrando categorias inválidas", async () => {
    profileMocks.getPlayerSessionFromRequest.mockResolvedValue({ userId: "user-1" });
    profileMocks.getPlayerProfile.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
      displayName: "Alex",
      avatarUrl: "",
      bio: "",
      preferredCategories: [],
      createdAt: "2026-04-05T12:00:00.000Z",
      updatedAt: "2026-04-05T12:00:00.000Z",
    });
    profileMocks.listCategories.mockResolvedValue(["Arcade", "Racing", "Puzzle"]);
    profileMocks.updatePlayerProfile.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
      displayName: "Alex",
      avatarUrl: "",
      bio: "Curto jogos rápidos.",
      preferredCategories: ["Arcade"],
      createdAt: "2026-04-05T12:00:00.000Z",
      updatedAt: "2026-04-05T12:00:00.000Z",
    });

    const response = await PATCH(
      new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: "Alex",
          bio: "Curto jogos rápidos.",
          preferredCategories: ["Arcade", "Inexistente"],
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(profileMocks.updatePlayerProfile).toHaveBeenCalledWith("user-1", {
      displayName: "Alex",
      bio: "Curto jogos rápidos.",
      preferredCategories: ["Arcade"],
    });
    expect(profileMocks.applyGamificationEvent).toHaveBeenCalledWith(
      "user-1",
      "profile_update",
    );
    await expect(response.json()).resolves.toMatchObject({
      displayName: "Alex",
      preferredCategories: ["Arcade"],
    });
  });

  it("retorna 400 quando o avatar é inválido", async () => {
    profileMocks.getPlayerSessionFromRequest.mockResolvedValue({ userId: "user-1" });

    const response = await PATCH(
      new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: "not-a-url",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Informe uma imagem válida para o avatar.",
    });
    expect(profileMocks.updatePlayerProfile).not.toHaveBeenCalled();
  });

  it("aceita avatar local salvo em uploads", async () => {
    profileMocks.getPlayerSessionFromRequest.mockResolvedValue({ userId: "user-1" });
    profileMocks.getPlayerProfile.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
      displayName: "Alex",
      avatarUrl: "",
      bio: "",
      preferredCategories: [],
      createdAt: "2026-04-05T12:00:00.000Z",
      updatedAt: "2026-04-05T12:00:00.000Z",
    });
    profileMocks.updatePlayerProfile.mockResolvedValue({
      id: "user-1",
      email: "player@example.com",
      displayName: "Alex",
      avatarUrl: "/uploads/avatars/alex.png",
      bio: "",
      preferredCategories: [],
      createdAt: "2026-04-05T12:00:00.000Z",
      updatedAt: "2026-04-05T12:00:00.000Z",
    });

    const response = await PATCH(
      new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: "/uploads/avatars/alex.png",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(profileMocks.updatePlayerProfile).toHaveBeenCalledWith("user-1", {
      avatarUrl: "/uploads/avatars/alex.png",
    });
  });
});