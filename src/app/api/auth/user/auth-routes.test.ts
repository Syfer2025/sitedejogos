const authMocks = vi.hoisted(() => ({
  createPlayerSession: vi.fn(),
  applyGamificationEvent: vi.fn(),
  getClientIp: vi.fn(),
  consumeRateLimit: vi.fn(),
  recordAnalyticsEvent: vi.fn(),
  registerPlayer: vi.fn(),
  setPlayerSessionCookie: vi.fn(),
  verifyPlayerCredentials: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  getClientIp: authMocks.getClientIp,
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: authMocks.consumeRateLimit,
}));

vi.mock("@/data/analyticsStore", () => ({
  recordAnalyticsEvent: authMocks.recordAnalyticsEvent,
}));

vi.mock("@/data/gamificationStore", () => ({
  applyGamificationEvent: authMocks.applyGamificationEvent,
}));

vi.mock("@/lib/user-auth", () => ({
  createPlayerSession: authMocks.createPlayerSession,
  registerPlayer: authMocks.registerPlayer,
  setPlayerSessionCookie: authMocks.setPlayerSessionCookie,
  verifyPlayerCredentials: authMocks.verifyPlayerCredentials,
}));

import { POST as loginPost } from "@/app/api/auth/user/login/route";
import { POST as registerPost } from "@/app/api/auth/user/register/route";

function createJsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("player auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getClientIp.mockReturnValue("127.0.0.1");
    authMocks.consumeRateLimit.mockReturnValue({
      ok: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    authMocks.createPlayerSession.mockResolvedValue("token-123");
    authMocks.setPlayerSessionCookie.mockImplementation(() => undefined);
    authMocks.recordAnalyticsEvent.mockResolvedValue(undefined);
    authMocks.applyGamificationEvent.mockResolvedValue(undefined);
  });

  it("faz login e registra analytics quando as credenciais são válidas", async () => {
    authMocks.verifyPlayerCredentials.mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
        email: "player@example.com",
        displayName: "Alex",
      },
    });

    const response = await loginPost(
      createJsonRequest("http://localhost/api/auth/user/login", {
        email: "player@example.com",
        password: "123456",
        sessionId: "session-login-1",
        referrer: "http://localhost:3000/",
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "player@example.com",
        displayName: "Alex",
      },
    });
    expect(authMocks.createPlayerSession).toHaveBeenCalledWith({
      userId: "user-1",
      ipAddress: "127.0.0.1",
      userAgent: undefined,
    });
    expect(authMocks.setPlayerSessionCookie).toHaveBeenCalledTimes(1);
    expect(authMocks.recordAnalyticsEvent).toHaveBeenCalledWith({
      type: "player_login",
      path: "/login",
      sessionId: "session-login-1",
      userId: "user-1",
      referrer: "http://localhost:3000/",
    });
    expect(authMocks.applyGamificationEvent).toHaveBeenCalledWith(
      "user-1",
      "login",
    );
  });

  it("retorna 401 quando o login falha", async () => {
    authMocks.verifyPlayerCredentials.mockResolvedValue({
      ok: false,
      reason: "invalid",
    });

    const response = await loginPost(
      createJsonRequest("http://localhost/api/auth/user/login", {
        email: "player@example.com",
        password: "123456",
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Email ou senha inválidos.",
    });
    expect(authMocks.createPlayerSession).not.toHaveBeenCalled();
    expect(authMocks.recordAnalyticsEvent).not.toHaveBeenCalled();
  });

  it("cria sessão e analytics quando o cadastro é bem-sucedido", async () => {
    authMocks.registerPlayer.mockResolvedValue({
      ok: true,
      user: {
        id: "user-2",
        email: "new@example.com",
        displayName: "Nova Pessoa",
      },
    });

    const response = await registerPost(
      createJsonRequest("http://localhost/api/auth/user/register", {
        displayName: "Nova Pessoa",
        email: "new@example.com",
        password: "123456",
        sessionId: "session-register-1",
        referrer: "http://localhost:3000/",
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      user: {
        id: "user-2",
        email: "new@example.com",
        displayName: "Nova Pessoa",
      },
    });
    expect(authMocks.createPlayerSession).toHaveBeenCalledWith({
      userId: "user-2",
      ipAddress: "127.0.0.1",
      userAgent: undefined,
    });
    expect(authMocks.recordAnalyticsEvent).toHaveBeenCalledWith({
      type: "player_register",
      path: "/login?mode=register",
      sessionId: "session-register-1",
      userId: "user-2",
      referrer: "http://localhost:3000/",
    });
    expect(authMocks.applyGamificationEvent).toHaveBeenCalledWith(
      "user-2",
      "register",
    );
  });

  it("retorna 409 quando o email já está em uso", async () => {
    authMocks.registerPlayer.mockResolvedValue({
      ok: false,
      reason: "email_taken",
    });

    const response = await registerPost(
      createJsonRequest("http://localhost/api/auth/user/register", {
        displayName: "Nova Pessoa",
        email: "new@example.com",
        password: "123456",
      }) as never,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Este email já está em uso.",
    });
    expect(authMocks.createPlayerSession).not.toHaveBeenCalled();
  });
});