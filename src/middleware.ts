import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES } from "./lib/locale";

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  // If we have a ?lang= query param and it's supported
  if (lang && SUPPORTED_LOCALES.includes(lang as any)) {
    const response = NextResponse.next();
    
    // Check current cookie
    const currentLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
    
    // If different, update cookie
    if (currentLocale !== lang) {
      response.cookies.set(LOCALE_COOKIE_NAME, lang, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, static, etc)
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)",
  ],
};
