"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export type ProfileTabKey = "feed" | "wallet" | "social" | "mission" | "library" | "security";

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
  { key: "security", label: "Segurança", icon: "🔒", colorClass: "text-red-400" },
];

interface ProfileSidebarNavProps {
  childrenMap: Record<ProfileTabKey, ReactNode>;
}

export function ProfileSidebarNav({ childrenMap }: ProfileSidebarNavProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("feed");
  const displayTabs = TABS;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Sidebar (Left) */}
      <aside className="space-y-4">
        <nav className="flex flex-col gap-1 rounded-3xl border border-slate-700/60 bg-[#0b0f1e] p-3 shadow-xl">
          {displayTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 outline-none
                  ${isActive
                    ? "bg-slate-800 text-white shadow border border-slate-600/50"
                    : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${isActive ? tab.colorClass : "grayscale opacity-50"} transition-all duration-200`}>
                    {tab.icon}
                  </span>
                  <span className={isActive ? tab.colorClass : ""}>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow shadow-red-500/40">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

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
