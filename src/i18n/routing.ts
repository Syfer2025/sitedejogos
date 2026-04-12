import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { LOCALE_MARKETS, DEFAULT_LOCALE } from "@/lib/locale";

export const locales = LOCALE_MARKETS.map((market) => market.value);
export const defaultLocale = DEFAULT_LOCALE;

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Não usar prefix de locale na URL (manter URLs limpas como /account)
  localePrefix: "never",
  // Cookie para armazenar o locale selecionado
  localeCookie: {
    name: "arcade_locale",
    maxAge: 365 * 24 * 60 * 60, // 1 ano
  },
});

// Componentes de navegação que respeitam o locale
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
