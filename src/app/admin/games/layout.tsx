import type { ReactNode } from "react";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  deleteAdminSession,
  getAdminSession,
} from "@/lib/admin-auth";

export default async function AdminGamesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await getAdminSession(token) : null;

  if (!session) {
    redirect("/admin/login");
  }

  async function logout() {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (token) {
      await deleteAdminSession(token);
    }

    cookieStore.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    redirect("/admin/login");
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-800 bg-slate-950/90">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">
            Admin Panel
          </div>
          <div className="text-sm font-medium text-slate-100 mt-1">
            Gasty Games
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {session.email}
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 text-sm space-y-1">
          <Link
            href="/admin/games"
            className="block rounded-lg px-3 py-2 bg-slate-900/80 border border-slate-800 text-slate-100 hover:border-purple-500 hover:bg-slate-900 transition-colors"
          >
            Games
          </Link>
          <Link
            href="/admin/games/achievements"
            className="block rounded-lg px-3 py-2 border border-slate-800 text-slate-300 hover:border-amber-500 hover:bg-slate-900 transition-colors"
          >
            Conquistas
          </Link>
          <Link
            href="/admin/games/blog"
            className="block rounded-lg px-3 py-2 border border-slate-800 text-slate-300 hover:border-emerald-500 hover:bg-slate-900 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/admin/games/analytics"
            className="block rounded-lg px-3 py-2 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:bg-slate-900 transition-colors"
          >
            Analytics
          </Link>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Secure Administration Area
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-red-500/80 text-slate-300 hover:text-red-200 bg-slate-900/70 hover:bg-red-950/40 transition-colors"
            >
              Logout
            </button>
          </form>
        </header>
        <div className="px-4 py-4 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}