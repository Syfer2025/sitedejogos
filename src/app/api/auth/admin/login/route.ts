import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAdminSession,
  getClientIp,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);
  const limit = consumeRateLimit(`admin-login:${ipAddress}`, {
    limit: LOGIN_ATTEMPT_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const credentials = await verifyAdminCredentials(email, password);

  if (!credentials.ok) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = await createAdminSession({
    email,
    ipAddress,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const res = NextResponse.json({ ok: true });

  setAdminSessionCookie(res, token);

  return res;
}
