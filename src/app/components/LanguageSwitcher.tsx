"use client";

import { startTransition, useState } from "react";

import { useRouter } from "next/navigation";

import { type Locale } from "@/lib/locale";

import { useLocale } from "./LocaleContext";

function getFlag(locale: Locale) {
  switch (locale) {
    case "pt-BR":
      return "🇧🇷";
    case "en":
      return "🇺🇸"; // pode ajustar para 🇬🇧 se preferir
    case "es":
      return "🇪🇸";
    default:
      return "";
  }
}

const LOCALE_OPTIONS: { value: Locale; short: string; label: string }[] = [
  { value: "pt-BR", short: "PT", label: "Português (BR)" },
  { value: "en", short: "EN", label: "English" },
  { value: "es", short: "ES", label: "Español" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const current = LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0];

  function handleSelect(next: Locale) {
    setLocale(next);
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="relative text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-950/80 px-2.5 py-1 text-slate-200 hover:border-purple-500/70 hover:text-white transition-colors min-w-[70px] justify-center"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs">{getFlag(current.value)}</span>
        <span className="text-[10px] tracking-wide">{current.short}</span>
        <span className="text-[9px] text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-lg py-1 z-20">
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-800/80 transition-colors ${
                locale === opt.value ? "text-slate-50" : "text-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-xs">{getFlag(opt.value)}</span>
                <span>{opt.label}</span>
              </span>
              {locale === opt.value && (
                <span className="text-[9px] text-emerald-400">●</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
