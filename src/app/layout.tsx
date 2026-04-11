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
import { Header } from "./components/Header";
import { GamificationNotifier } from "./components/GamificationNotifier";
import { LOCALE_COOKIE_NAME, resolveLocale, SUPPORTED_LOCALES } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { isPlayerPremium } from "@/data/monetizationStore";
import Script from "next/script";
import { SITE_CONFIG } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { logoutPlayer } from "./actions/auth";

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

  // Fetch Header data on server
  const headerData = playerSession ? await Promise.all([
    (await import("@/data/gamificationStore")).getPlayerGamificationOverview(playerSession.user.id).then(g => g?.notifications ?? []),
    (await import("@/data/playerStore")).listFavoriteGames(playerSession.user.id, 10).then(f => f.map(entry => ({ game: entry.game }))),
    (await import("@/data/playerStore")).listRecentlyPlayed(playerSession.user.id, 10).then(h => h.map(entry => ({ game: entry.game }))),
    prisma.gameRating.findMany({ where: { userId: playerSession.user.id }, include: { game: true }, take: 10, orderBy: { updatedAt: 'desc' }})
  ]) : [[], [], [], []];

  const [notifications, favorites, recentGames, ratedGames] = headerData;
  
  const premium = playerSession ? await isPlayerPremium(playerSession.user.id) : false;
  const adsenseClientId = premium ? undefined : (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5055044496746954");
  const t = { ...dict.common, ...dict.home };

  return (
    <html
      lang={initialLocale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a855f7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gasty Games" />
      </head>
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
            {/* Pass server data to Header (which is a client component) */}
            <Header 
              playerSession={playerSession}
              t={t}
              logoutAction={logoutPlayer}
              initialNotifications={notifications}
              favorites={favorites}
              recentGames={recentGames}
              ratedGames={ratedGames}
            />
            <GamificationNotifier />
            <main className="flex-1 pb-14 sm:pb-0 overflow-hidden min-h-0 min-w-0">{children}</main>
            
            <MobileBottomNav />
          </AdBlockProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
