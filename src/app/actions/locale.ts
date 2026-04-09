"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE_NAME, isSupportedLocale, type Locale } from "@/lib/locale";

/**
 * Server Action to update the locale cookie and revalidate the page.
 * This is more reliable than client-side document.cookie updates.
 */
export async function setLocaleAction(locale: Locale) {
  if (!isSupportedLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const cookieStore = await cookies();
  
  // Set the cookie on the server response
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Keep it accessible to JS for hydrations
  });

  // Force revalidation of the entire site to clear cache for this user
  revalidatePath("/", "layout");
  
  return { success: true, locale };
}
