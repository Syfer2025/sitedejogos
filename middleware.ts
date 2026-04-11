import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Vercel Deployment Protection Bypass Token
// Gerado em: Vercel Dashboard > Settings > Deployment Protection
const VERCEL_BYPASS_TOKEN = process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS;

export async function middleware(request: NextRequest) {
  // Se não temos o token de bypass, não fazemos nada
  // (A proteção da Vercel já será aplicada normalmente)
  if (!VERCEL_BYPASS_TOKEN) {
    return NextResponse.next();
  }

  // Adiciona headers para bypass da proteção da Vercel
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vercel-protection-bypass", VERCEL_BYPASS_TOKEN);
  requestHeaders.set("x-vercel-set-bypass-cookie", "true");

  // Retorna a resposta com os headers modificados
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Rodar apenas em páginas protegidas (todas as páginas da aplicação)
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (sw.js, manifest.json, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\..*|_next).*)",
  ],
};
