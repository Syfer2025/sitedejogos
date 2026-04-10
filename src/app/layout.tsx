import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { LocaleProvider } from "./components/LocaleContext";
import { AdBlockProvider } from "./components/AdBlockDetector";
import { Footer } from "./components/Footer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PageAnalyticsTracker } from "./components/PageAnalyticsTracker";
import { LOCALE_COOKIE_NAME, resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { isPlayerPremium } from "@/data/monetizationStore";
import Script from "next/script";
import { SITE_CONFIG } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const dict = await getDictionary(locale);
  const siteUrl = SITE_CONFIG.url;
  
  const languages: Record<string, string> = {};
  SUPPORTED_LOCALES.forEach((loc) => {
    languages[loc] = `${siteUrl}?lang=${loc}`;
  });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Gasty Games - Milhares de Jogos Grátis Online",
      template: "%s | Gasty Games",
    },
    description: dict.home.heroSubtitle,
    alternates: {
      canonical: "/",
      languages,
    },
    openGraph: {
      title: "Gasty Games",
      description: dict.home.heroSubtitle,
      url: siteUrl,
      siteName: "Gasty Games",
      locale: locale,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;

  const [playerSession, dict] = await Promise.all([
    playerToken ? getPlayerSession(playerToken) : null,
    getDictionary(initialLocale),
  ]);
  
  const premium = playerSession ? await isPlayerPremium(playerSession.user.id) : false;
  const adsenseClientId = premium ? undefined : (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5055044496746954");
  const t = { ...dict.common, ...dict.home };

  async function logoutPlayer() {
    "use server";
    const cookieStore = await cookies();
    const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;

    if (playerToken) {
      const { deletePlayerSession } = await import("@/lib/user-auth");
      await deletePlayerSession(playerToken);
    }

    cookieStore.set(PLAYER_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    redirect("/");
  }

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head />
      {adsenseClientId ? (
        <Script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          strategy="afterInteractive"
        />
      ) : null}
      <body className="h-screen overflow-hidden text-slate-100 flex flex-col" data-default-locale={initialLocale}>
        <LocaleProvider initialLocale={initialLocale}>
          <AdBlockProvider isPremium={premium}>
            <PageAnalyticsTracker />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": SITE_CONFIG.name,
                  "url": SITE_CONFIG.url,
                  "logo": `${SITE_CONFIG.url}/logo.png`,
                  "sameAs": [SITE_CONFIG.facebookPage]
                })
              }}
            />
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
              <nav className="relative flex w-full items-center gap-4 px-4 py-2.5">
                <div className="flex shrink-0 items-center gap-4 lg:gap-6">
                  <Link href="/" className="flex shrink-0 items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-lg font-semibold tracking-tight text-white">Gasty Games</span>
                      <span className="hidden text-[11px] text-slate-400 sm:block">{t.noInstalls}</span>
                    </div>
                  </Link>

                  <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
                    <Link href="/" className="rounded-md px-3 py-1.5 transition-all duration-150 hover:bg-slate-800/60 hover:text-white">{t.home}</Link>
                    <Link href="/blog" className="rounded-md px-3 py-1.5 transition-all duration-150 hover:bg-slate-800/60 hover:text-white">{t.blog}</Link>
                  </div>
                </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 hidden w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 xl:block">
                  <form action="/#catalogo" className="pointer-events-auto relative w-full">
                    <input
                      name="q"
                      type="text"
                      placeholder={t.search}
                      className="h-9 w-full rounded-full border border-slate-700/70 bg-slate-900/80 px-4 pr-16 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/60 focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
                    />
                    <button type="submit" className="absolute right-1 top-1 inline-flex h-7 items-center rounded-full bg-cyan-400/15 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-400/25">
                      {t.search?.split(" ")[0]}
                    </button>
                  </form>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                  <div className="shrink-0"><LanguageSwitcher /></div>
                  {playerSession ? (
                    <div className="hidden sm:flex items-center gap-2">
                      <Link href="/account" className="inline-flex max-w-[140px] items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100 transition-colors hover:border-cyan-300/70 hover:bg-cyan-500/15">
                        {premium && <span className="text-amber-400">★</span>}
                        <span className="truncate">{playerSession.user.displayName}</span>
                      </Link>
                      <form action={logoutPlayer}>
                        <button type="submit" className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-200 transition-colors hover:border-red-500/80 hover:bg-red-950/40 hover:text-white">{t.logout}</button>
                      </form>
                    </div>
                  ) : (
                    <Link href="/login" className="hidden sm:inline-flex items-center rounded-full border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100 transition-colors hover:border-cyan-400 hover:bg-cyan-500/15">{t.login}</Link>
                  )}
                </div>
              </nav>
            </header>

            <main className="flex-1 pb-14 sm:pb-0 overflow-hidden">{children}</main>
            
            <MobileBottomNav />
          </AdBlockProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
