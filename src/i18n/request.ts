import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Tipicamente isso vem do cookie ou do Accept-Language header
  let locale = await requestLocale;

  // Se não tiver locale, usa o default
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
