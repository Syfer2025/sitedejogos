import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "@/lib/locale";

const ADMIN_SESSION_COOKIE = "admin_session";

// ── Content-Security-Policy ───────────────────────────────────────────────────
function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "media-src 'self' blob: https:",
    "style-src 'self' 'unsafe-inline' https:",
    // unsafe-eval required in dev (Next.js HMR); unsafe-inline required for
    // AdSense and Next.js inline hydration scripts.
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://adservice.google.com https://partner.googleadservices.com https://www.googletagmanager.com https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://googleads.g.doubleclick.net`,
    "connect-src 'self' https: ws: wss:",
    // frame-src: games embed from arbitrary HTTPS domains — must stay open
    "frame-src https: data:",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

// ── CSRF Origin Validation ────────────────────────────────────────────────────
// State-changing API requests from a browser always carry an Origin header.
// We reject any that don't match our host.
// Skipped for: cron routes (Vercel-triggered, no browser origin) and admin
// routes (protected by separate session auth check below).

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CSRF_SKIP_PREFIXES = [
  "/api/cron/",
  "/api/admin/",
  "/api/auth/admin/",
];

function checkCsrf(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  if (!pathname.startsWith("/api/") || !MUTATION_METHODS.has(method)) {
    return null;
  }

  if (CSRF_SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const origin = req.headers.get("origin");

  // No Origin → server-to-server or same-origin non-cross-site request. Allow.
  if (!origin) return null;

  const host = req.headers.get("host");
  if (!host) return null;

  try {
    const originHost = new URL(origin).host;
    if (originHost === host) return null;
  } catch {
    // Malformed Origin — reject below
  }

  return NextResponse.json({ error: "Requisição inválida." }, { status: 403 });
}

// ── Main proxy function ───────────────────────────────────────────────────────
export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Admin route guard — redirect to login if no session cookie
  const isAdminPath =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAdminPath) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. CSRF check for user-facing API mutations
  const csrfError = checkCsrf(req);
  if (csrfError) return csrfError;

  // 3. Locale cookie sync (?lang= query param)
  const lang = searchParams.get("lang");
  let res = NextResponse.next();

  if (lang && SUPPORTED_LOCALES.includes(lang as any)) {
    const currentLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
    if (currentLocale !== lang) {
      res.cookies.set(LOCALE_COOKIE_NAME, lang, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }
  }

  // 4. Security headers
  res.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // Ensure CDNs vary cache by the locale cookie
  res.headers.set("Vary", "Cookie");

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
