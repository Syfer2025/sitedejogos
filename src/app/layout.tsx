import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { LocaleProvider } from "./components/LocaleContext";
import { AdBlockProvider } from "./components/AdBlockDetector";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { PageAnalyticsTracker } from "./components/PageAnalyticsTracker";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/locale";
import { getPlayerSession, PLAYER_SESSION_COOKIE } from "@/lib/user-auth";
import { isPlayerPremium } from "@/data/monetizationStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Arcade Nexus",
    template: "%s | Arcade Nexus",
  },
  description: "Portal moderno de jogos HTML5 com SEO, catálogo curado e monetização pronta para anúncios.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const playerToken = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
  const playerSession = playerToken ? await getPlayerSession(playerToken) : null;
  const premium = playerSession ? await isPlayerPremium(playerSession.user.id) : false;
  const adsenseClientId = premium ? undefined : process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

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
      <body className="min-h-screen text-slate-100 flex flex-col" data-default-locale={initialLocale}>
        {adsenseClientId ? (
          <Script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
          />
        ) : null}
        <LocaleProvider initialLocale={initialLocale}>
          <AdBlockProvider>
          <PageAnalyticsTracker />
          <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
            <nav className="px-4 py-2.5 flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-lg tracking-tight">
                      Arcade Nexus
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Portal de jogos HTML5
                    </span>
                  </div>
                </Link>

              <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
                  <Link href="/" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/60 transition-all duration-150">
                  Início
                  </Link>
                  <Link href="/#catalogo" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/60 transition-all duration-150">
                  Categorias
                  </Link>
                  <Link href="/blog" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/60 transition-all duration-150">
                  Blog
                  </Link>
                  <Link href="/#catalogo" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/60 transition-all duration-150">
                  Todos os jogos
                  </Link>
              </div>

              <div className="flex-1 md:flex-none flex items-center justify-end gap-3">
                  <form action="/#catalogo" className="hidden sm:block relative w-full max-w-xs">
                  <input
                      name="q"
                    type="text"
                    placeholder="Buscar jogos..."
                    className="w-full rounded-full bg-slate-900/80 border border-slate-700/70 px-4 py-1.5 pr-9 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400/70 shadow-inner shadow-black/60"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-xs">
                    ⌕
                  </span>
                  </form>
                <LanguageSwitcher />
                {playerSession ? (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 hover:border-cyan-300/70 hover:bg-cyan-500/15 text-cyan-100 transition-colors max-w-[140px]"
                    >
                      {premium && <span className="text-amber-400">★</span>}
                      <span className="truncate">{playerSession.user.displayName}</span>
                    </Link>
                    <form action={logoutPlayer}>
                      <button
                        type="submit"
                        className="inline-flex items-center text-[11px] px-3 py-1 rounded-full border border-slate-700/80 bg-slate-950/80 hover:border-red-500/80 hover:bg-red-950/40 text-slate-200 hover:text-white transition-colors"
                      >
                        Sair
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center text-[11px] px-3 py-1 rounded-full border border-cyan-500/50 bg-cyan-500/10 hover:border-cyan-400 hover:bg-cyan-500/15 text-cyan-100 transition-colors"
                  >
                    Entrar
                  </Link>
                )}
                  <Link
                    href="/admin/login"
                  className="hidden sm:inline-flex items-center text-[11px] px-3 py-1 rounded-full border border-slate-700/80 bg-slate-950/80 hover:border-purple-500/80 hover:bg-purple-950/50 text-slate-200 hover:text-white transition-colors"
                >
                  Admin
                  </Link>
              </div>
            </nav>
          </header>

          <main className="flex-1 pb-14 sm:pb-0">{children}</main>

          <MobileBottomNav />

          <footer className="hidden sm:block border-t border-slate-800 bg-slate-950/80">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-slate-500">
              <span>© {new Date().getFullYear()} Arcade Nexus</span>
              <span>HTML5 Gaming Portal Template</span>
            </div>
          </footer>
          </AdBlockProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
