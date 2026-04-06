"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: "🏠", activeIcon: "🏠" },
  { href: "/#catalogo", label: "Jogos", icon: "🎮", activeIcon: "🎮" },
  { href: "/blog", label: "Blog", icon: "📝", activeIcon: "📝" },
  { href: "/account", label: "Perfil", icon: "👤", activeIcon: "👤" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-lg sm:hidden safe-area-bottom">
      <div className="grid grid-cols-4 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" && hash !== "#catalogo"
              : item.href === "/#catalogo"
              ? pathname === "/" && hash === "#catalogo"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 text-[10px] transition-colors active:scale-95 ${
                isActive
                  ? "text-cyan-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="text-lg leading-none">
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
