import { consumeRateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("bloqueia após exceder o limite", () => {
    const key = `test-limit-${Math.random()}`;

    expect(consumeRateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(true);
    expect(consumeRateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(true);
    expect(consumeRateLimit(key, { limit: 2, windowMs: 1000 }).ok).toBe(false);
  });

  it("reinicia contagem ao virar a janela", () => {
    const key = `test-reset-${Math.random()}`;
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValue(1_000);
    expect(consumeRateLimit(key, { limit: 1, windowMs: 500 }).ok).toBe(true);

    nowSpy.mockReturnValue(1_200);
    expect(consumeRateLimit(key, { limit: 1, windowMs: 500 }).ok).toBe(false);

    nowSpy.mockReturnValue(1_600);
    expect(consumeRateLimit(key, { limit: 1, windowMs: 500 }).ok).toBe(true);
  });
});