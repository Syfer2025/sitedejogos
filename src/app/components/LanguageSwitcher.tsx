"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { getLocaleDefinition, LOCALE_MARKETS, type Locale } from "@/lib/locale";

import { useLocale, useTranslate } from "./LocaleContext";
import { setLocaleAction } from "../actions/locale";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = getLocaleDefinition(locale);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSelect(next: Locale) {
    // 1. Update the client-side context for immediate UI feedback (client components)
    setLocale(next);
    setOpen(false);

    // 2. Call the server action to update the cookie and revalidate
    // This ensures Server Components update on the next render.
    await setLocaleAction(next);
    
    // 3. Force a refresh to show the server-side changes
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-950/80 px-2.5 py-1 text-slate-200 transition-colors hover:border-purple-500/70 hover:text-white"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs">{current.flag}</span>
        <span className="text-[10px] tracking-wide">{current.short}</span>
        <span className="text-[9px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[290px] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-[0_18px_45px_rgba(2,6,23,0.6)] backdrop-blur-md">
          <div className="border-b border-slate-800/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t("common.languages")}
            </p>
          </div>
          <div role="listbox" className="scrollbar-locale max-h-[420px] overflow-y-auto py-1 pr-1">
          {LOCALE_MARKETS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full px-3 py-2 text-left transition-colors hover:bg-slate-800/80 ${
                locale === opt.value ? "text-slate-50" : "text-slate-300"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-2.5">
                  <span className="pt-0.5 text-base">{opt.flag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-slate-100">{opt.country}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">{opt.label}</span>
                  </span>
                </span>
                {locale === opt.value ? (
                  <span className="pt-1 text-[9px] text-emerald-400">●</span>
                ) : null}
              </span>
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
