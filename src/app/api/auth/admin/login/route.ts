import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createAdminSession,
  getClientIp,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;

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

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  const credentials = await verifyAdminCredentials(email, password);

  if (credentials.reason === "missing_config") {
    return NextResponse.json(
      { message: "Admin credentials are not configured" },
      { status: 500 },
    );
  }

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
