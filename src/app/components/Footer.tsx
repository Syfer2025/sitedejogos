"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SITE_CONFIG } from "@/lib/config";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-auto border-t border-slate-800/60 bg-slate-950 px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Newsletter strip */}
        <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-6">
          <NewsletterForm />
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          {/* Logo & Desc */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-cyan-400" />
              <span className="text-lg font-bold text-white">{SITE_CONFIG.name}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {t("common.footer.desc")}
            </p>
          </div>

          {/* Home */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">
              {t("common.home")}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="transition-colors hover:text-cyan-300">
                  {t("common.home")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-cyan-300">
                  {t("common.blog")}
                </Link>
              </li>
              <li>
                <Link href="/account" className="transition-colors hover:text-cyan-300">
                  {t("common.account")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-200">
              {t("common.footer.legal")}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-cyan-300">
                  {t("common.footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-cyan-300">
                  {t("common.footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cyan-300">
                  {t("common.footer.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/60 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {SITE_CONFIG.name}. {t("common.footer.rights")}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={SITE_CONFIG.facebookPage}
              target="_blank"
              className="text-slate-500 hover:text-white transition-colors"
            >
              {t("common.footer.facebook", {}, "Facebook")}
            </Link>
            <a
              href={`https://twitter.com/${SITE_CONFIG.twitterHandle.replace("@", "")}`}
              target="_blank"
              className="text-slate-500 hover:text-white transition-colors"
            >
              {t("common.footer.twitter", {}, "Twitter")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
