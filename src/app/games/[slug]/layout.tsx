import type { ReactNode } from "react";
import Link from "next/link";

import { PlayerSidebar } from "../../components/PlayerSidebar";

export default function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-[calc(100vh-56px-48px)]"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, rgba(96, 165, 250, 0.18), transparent 60%)," +
          "radial-gradient(circle at 10% 90%, rgba(147, 51, 234, 0.35), transparent 65%)," +
          "radial-gradient(circle at 95% 85%, rgba(8, 47, 73, 0.45), transparent 60%)," +
          "linear-gradient(180deg, #020617, #020617, #020617)",
      }}
    >
      <div className="flex">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <nav className="mb-4 text-[11px] text-slate-400 flex items-center gap-1">
              <Link
                href="/"
                className="hover:text-slate-100 transition-colors"
              >
                Home
              </Link>
              <span className="opacity-60">/</span>
              <span className="text-slate-300">Game</span>
            </nav>
            {children}
          </div>
        </div>

        {/* Right sidebar — Player / Ranking */}
        <aside className="hidden xl:flex w-[320px] flex-none flex-col border-l border-slate-800/60 bg-slate-950/60 overflow-y-auto scrollbar-thin">
          <PlayerSidebar />
        </aside>
      </div>
    </div>
  );
}
