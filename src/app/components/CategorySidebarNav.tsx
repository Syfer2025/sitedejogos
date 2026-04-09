"use client";

import Link from "next/link";

import { dispatchCatalogFilter } from "./HomeThemeCatalog";
import { getCategoryEmoji } from "@/lib/catalog-category-emoji";
import { useTranslate } from "./LocaleContext";

export function CategorySidebarNav({
  categories,
}: {
  categories: string[];
}) {
  const t = useTranslate();
  
  return (
    <>
      <div className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
          {t("common.categories")}
        </p>

        <button
          type="button"
          onClick={() => dispatchCatalogFilter("")}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 transition-all duration-200 hover:bg-cyan-400/15 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]"
        >
          <span className="text-base">🎮</span>
          <span>{t("common.viewAll")}</span>
        </button>

        <div className="space-y-0.5 mt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => dispatchCatalogFilter(cat)}
              className="group w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-all duration-150 hover:bg-slate-800/70 hover:text-slate-100 hover:pl-4 text-left"
            >
              <span className="text-sm flex-none w-5 text-center transition-transform group-hover:scale-110">
                {getCategoryEmoji(cat)}
              </span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blog link at bottom */}
      <div className="mt-auto border-t border-slate-800/60 p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
          {t("common.blog")}
        </p>
        <Link
          href="/blog"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          📰 {t("home.blogTitle")}
        </Link>
      </div>
    </>
  );
}
