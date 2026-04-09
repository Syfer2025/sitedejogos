import { resolveLocale, type Locale } from "./locale";

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

  try {
    // In Next.js, dynamic imports with template literals are supported
    // but they generate a chunk for every file in the directory.
    console.log(`[i18n] Loading dictionary for: ${resolved}`);
    const dictionary = (await import(`@/messages/${resolved}.json`)).default;
    dictionaries[resolved] = dictionary;
    return dictionary;
  } catch (error) {
    console.error(`[i18n] FAILED to load dictionary for locale: ${resolved}`, error);
    
    // Fallback to English if the specific locale fails
    if (resolved !== "en-US") {
      console.log(`[i18n] FALLING BACK to en-US for: ${resolved}`);
      return getDictionary("en-US");
    }
    
    // Final fallback if even English fails
    console.log(`[i18n] CRITICAL FALLBACK to pt-BR`);
    return (await import(`@/messages/pt-BR.json`)).default;
  }
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
