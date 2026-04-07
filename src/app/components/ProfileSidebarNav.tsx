"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export type ProfileTabKey = "feed" | "wallet" | "social" | "mission" | "library" | "profile" | "notifications";

interface TabDef {
  key: ProfileTabKey;
  label: string;
  icon: string;
  count?: number;
  colorClass: string;
}

const TABS: TabDef[] = [
  { key: "feed", label: "Feed de Atividades", icon: "📰", colorClass: "text-blue-400" },
  { key: "wallet", label: "Carteira", icon: "🪙", colorClass: "text-amber-400" },
  { key: "social", label: "Social", icon: "👥", colorClass: "text-cyan-400" },
  { key: "mission", label: "Missão", icon: "🎯", colorClass: "text-emerald-400" },
  { key: "library", label: "Biblioteca", icon: "📚", colorClass: "text-pink-400" },
  { key: "profile", label: "Perfil", icon: "✏️", colorClass: "text-violet-400" },
  { key: "notifications", label: "Avisos", icon: "🔔", count: 21, colorClass: "text-yellow-400" },
];

interface ProfileSidebarNavProps {
  childrenMap: Record<ProfileTabKey, ReactNode>;
  notificationCount?: number;
}

export function ProfileSidebarNav({ childrenMap, notificationCount = 0 }: ProfileSidebarNavProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("feed");

  // Sync real count if provided
  const displayTabs = TABS.map(tab => {
    if (tab.key === "notifications") {
      return { ...tab, count: notificationCount > 0 ? notificationCount : undefined };
    }
    return tab;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Sidebar (Left) */}
      <aside className="space-y-4">
        <nav className="flex flex-col gap-1 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-3 shadow-xl">
          {displayTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 outline-none
                  ${isActive 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${isActive ? tab.colorClass : "grayscale opacity-70"}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Support Card / Nitro Promo */}
        <div className="group relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-indigo-950/20 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="absolute -right-4 -top-4 text-6xl opacity-20 transition-transform group-hover:scale-110 group-hover:rotate-12">⭐</div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400">Upgrade</p>
          <h4 className="mt-2 text-lg font-black text-white">Arcade Nitro</h4>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">Libere temas exclusivos e 2x XP agora mesmo!</p>
          <button className="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 hover:scale-[1.02]">
            ASSINAR AGORA
          </button>
        </div>
      </aside>

      {/* Main Content (Right) */}
      <main className="min-w-0 lg:relative lg:min-h-[500px]">
        <div key={activeTab} className="animate-fade-in lg:absolute lg:inset-0">
          {childrenMap[activeTab]}
        </div>
      </main>
    </div>
  );
}
