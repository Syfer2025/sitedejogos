import type { ReactNode } from "react";

import { HomeRightSidebar } from "../../components/HomeRightSidebar";

export default function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-57px)]">
      <main className="relative z-[1] flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        {children}
      </main>
      <HomeRightSidebar />
    </div>
  );
}
