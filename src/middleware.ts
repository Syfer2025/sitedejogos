import { type NextRequest, NextResponse } from "next/server";

// ── CSRF Origin Validation ────────────────────────────────────────────────────
// For state-changing requests (POST/PUT/PATCH/DELETE) on user-facing API routes,
// validate that the Origin header matches our host. This is defense-in-depth
// alongside sameSite:lax cookies, which already block cross-site cookie sending.
//
// We skip:
//  - Safe methods (GET, HEAD, OPTIONS)
//  - Cron routes (triggered by Vercel, no browser Origin)
//  - Admin routes (separate session auth, server-to-server safe)

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_SKIP_PREFIXES = [
  "/api/cron/",
  "/api/admin/",        // admin auth already validates session
  "/api/auth/admin/",   // admin login — no user session involved
];

function isCsrfSkipped(pathname: string): boolean {
  return CSRF_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiMutation(pathname: string, method: string): boolean {
  return pathname.startsWith("/api/") && MUTATION_METHODS.has(method);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  if (!isApiMutation(pathname, method) || isCsrfSkipped(pathname)) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin");

  // No Origin header → server-to-server or same-origin form (pre-fetch).
  // Allow but note: browsers always send Origin on cross-site requests,
  // so absence here is generally safe in an HTTPS-only environment.
  if (!origin) {
    return NextResponse.next();
  }

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.next();
  }

  // Accept requests whose origin matches our host (any scheme)
  try {
    const originHost = new URL(origin).host;
    if (originHost === host) {
      return NextResponse.next();
    }
  } catch {
    // Malformed Origin header — reject
  }

  return NextResponse.json(
    { error: "Requisição inválida." },
    { status: 403 },
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
