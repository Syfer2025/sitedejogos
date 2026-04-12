import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Habilitar em todas as rotas exceto:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico
    // - arquivos públicos (sw.js, manifest.json, etc)
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\..*).*)",
  ],
};
