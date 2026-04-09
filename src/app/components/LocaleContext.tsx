"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, useMemo } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/locale";

// Static import map — Turbopack cannot resolve template-literal dynamic imports
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

const LOCALE_EVENT_NAME = "arcade-locale-change";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dictionary: any;
  t: (key: string, variables?: Record<string, string | number>, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(fallback: Locale) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved && SUPPORTED_LOCALES.includes(saved as Locale)
    ? (saved as Locale)
    : fallback;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(LOCALE_EVENT_NAME, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LOCALE_EVENT_NAME, handleChange);
  };
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const locale = useSyncExternalStore(
    subscribe,
    () => readStoredLocale(initialLocale),
    () => initialLocale
  );

  const [dictionary, setDictionary] = useState<any>(null);

  useEffect(() => {
    const loader = clientDictionaryLoaders[locale] ?? clientDictionaryLoaders["en-US"];
    loader()
      .then((mod) => setDictionary(mod.default))
      .catch((err) => {
        console.error("Failed to load client dictionary", err);
        clientDictionaryLoaders["pt-BR"]().then(mod => setDictionary(mod.default));
      });
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  function setLocale(next: Locale) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(LOCALE_EVENT_NAME));
  }

  const t = useMemo(() => {
    return (key: string, variables?: Record<string, string | number>, fallback?: string) => {
      if (!dictionary) return fallback ?? key;
      
      const keys = key.split(".");
      let result = dictionary;
      
      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          result = fallback ?? key;
          break;
        }
      }
      
      let text = typeof result === "string" ? result : (fallback ?? key);

      if (variables) {
        Object.entries(variables).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }

      return text;
    };
  }, [dictionary]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dictionary, t }}>
      {children}
    </LocaleContext.Provider>
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
