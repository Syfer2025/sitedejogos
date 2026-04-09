import { resolveLocale, type Locale } from "./locale";

// Static import map — Turbopack cannot resolve template-literal dynamic imports
// so each locale must be an explicit import() call.
const dictionaryLoaders: Record<string, () => Promise<{ default: any }>> = {
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

// Cache for dictionaries to avoid repeated imports
const dictionaries: Record<string, any> = {};

/**
 * Loads the dictionary for the specified locale.
 * This is designed to be used in Server Components.
 */
export async function getDictionary(locale: Locale) {
  const resolved = resolveLocale(locale);

  if (dictionaries[resolved]) {
    return dictionaries[resolved];
  }

  const loader = dictionaryLoaders[resolved];

  if (loader) {
    try {
      const dictionary = (await loader()).default;
      dictionaries[resolved] = dictionary;
      return dictionary;
    } catch (error) {
      console.error(`[i18n] FAILED to load dictionary for locale: ${resolved}`, error);
    }
  }

  // Fallback to English, then Portuguese
  if (resolved !== "en-US") {
    return getDictionary("en-US");
  }

  const fallback = (await dictionaryLoaders["pt-BR"]()).default;
  dictionaries["pt-BR"] = fallback;
  return fallback;
}

/**
 * Helper to get a nested value from the dictionary using a dot-notation key.
 * Supports basic interpolation using {variableName} syntax.
 * Example: t(dict, "player.levelUp", { level: 5 })
 */
export function t(
  dictionary: any,
  key: string,
  variables?: Record<string, string | number>,
  fallback?: string
): string {
  const keys = key.split(".");
  let value = dictionary;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      value = fallback ?? key;
      break;
    }
  }

  let text = typeof value === "string" ? value : (fallback ?? key);

  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }

  return text;
}
