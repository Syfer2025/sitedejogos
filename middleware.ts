import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware simplificado - apenas detecta locale do cookie
export default async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Verificar se o cookie de locale existe
  const localeCookie = request.cookies.get("arcade_locale");
  
  if (!localeCookie && request.nextUrl.pathname !== "/") {
    // Definir locale padrão se não existir cookie
    response.cookies.set("arcade_locale", "pt-BR", {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\..*).*)",
  ],
};
