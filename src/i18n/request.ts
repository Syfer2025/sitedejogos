import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";

export default getRequestConfig(async ({ requestLocale }) => {
  // Primeiro tenta o requestLocale (do middleware/headers)
  let locale = await requestLocale;

  // Se não tiver, tenta o cookie
  if (!locale) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    locale = resolveLocale(cookieValue);
  }

  // Se ainda não tiver, usa o default
  if (!locale) {
    locale = routing.defaultLocale;
  }

  // Validar se é um locale suportado
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Carregar apenas o locale necessário (code splitting automático)
  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
