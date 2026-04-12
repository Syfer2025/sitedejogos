"use client";

import {
  NextIntlClientProvider,
  useTranslations as useNextIntlTranslations,
} from "next-intl";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/locale";

// Static import map para compatibilidade
const clientDictionaryLoaders: Record<string, () => Promise<{ default: any }>> = {
  "en-US": () => import("@/messages/en-US.json"),
  "zh-CN": () => import("@/messages/zh-CN.json"),
  "hi-IN": () => import("@/messages/hi-IN.json"),
  "pt-BR": () => import("@/messages/pt-BR.json"),
  "tr-TR": () => import("@/messages/tr-TR.json"),
  "id-ID": () => import("@/messages/id-ID.json"),
  "vi-VN": () => import("@/messages/vi-VN.json"),
  "de-DE": () => import("@/messages/de-DE.json"),
  "fil-PH": () => import("@/messages/fil-PH.json"),
  "es-MX": () => import("@/messages/es-MX.json"),
  "en-GB": () => import("@/messages/en-GB.json"),
  "fr-FR": () => import("@/messages/fr-FR.json"),
  "th-TH": () => import("@/messages/th-TH.json"),
  "ur-PK": () => import("@/messages/ur-PK.json"),
  "en-NG": () => import("@/messages/en-NG.json"),
  "ar-EG": () => import("@/messages/ar-EG.json"),
  "ms-MY": () => import("@/messages/ms-MY.json"),
  "es-CO": () => import("@/messages/es-CO.json"),
  "ru-RU": () => import("@/messages/ru-RU.json"),
  "es-AR": () => import("@/messages/es-AR.json"),
  "es-ES": () => import("@/messages/es-ES.json"),
  "en-CA": () => import("@/messages/en-CA.json"),
  "pl-PL": () => import("@/messages/pl-PL.json"),
  "ar-SA": () => import("@/messages/ar-SA.json"),
  "bn-BD": () => import("@/messages/bn-BD.json"),
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dictionary: any;
  t: (key: string, variables?: Record<string, string | number>, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(fallback: Locale) {
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved && SUPPORTED_LOCALES.includes(saved as Locale) ? (saved as Locale) : fallback;
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  messages,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  messages?: any;
}) {
  const locale = readStoredLocale(initialLocale);
  const [dictionary, setDictionary] = useState<any>(messages || null);

  // Carregar dicionário para compatibilidade com código antigo
  useEffect(() => {
    if (messages) {
      setDictionary(messages);
      return;
    }
    
    const loader = clientDictionaryLoaders[locale] ?? clientDictionaryLoaders["en-US"];
    loader()
      .then((mod) => setDictionary(mod.default))
      .catch((err) => {
        console.error("Failed to load client dictionary", err);
        clientDictionaryLoaders["pt-BR"]().then((mod) => setDictionary(mod.default));
      });
  }, [locale, messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  function setLocale(next: Locale) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  // Função t compatível com sistema antigo (sem RegExp!)
  const t = (key: string, variables?: Record<string, string | number>, fallback?: string) => {
    if (!dictionary) return fallback ?? key;

    const keys = key.split(".");
    let result: any = dictionary;

    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k];
      } else {
        result = fallback ?? key;
        break;
      }
    }

    let text = typeof result === "string" ? result : (fallback ?? key);

    // Substituição otimizada sem RegExp
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        const placeholder = `{${k}}`;
        while (text.includes(placeholder)) {
          text = text.replace(placeholder, String(v));
        }
      });
    }

    return text;
  };

  return (
    <NextIntlClientProvider locale={locale} messages={dictionary || {}}>
      <LocaleContext.Provider value={{ locale, setLocale, dictionary, t }}>
        {children}
      </LocaleContext.Provider>
    </NextIntlClientProvider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useTranslate() {
  const { t } = useLocale();
  return t;
}
