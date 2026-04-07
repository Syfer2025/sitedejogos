"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect, useCallback } from "react";

type TabKey = "wallet" | "social" | "mission" | "library" | "profile" | "notifications";

type TabDef = {
  key: TabKey;
  label: string;
  icon: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
};

const TABS: TabDef[] = [
  {
    key: "wallet",
    label: "Carteira",
    icon: "🪙",
    glowColor: "shadow-[0_0_16px_rgba(245,158,11,0.2)]",
    borderColor: "border-amber-400/40",
    textColor: "text-amber-200",
    bgColor: "bg-amber-500/10",
  },
  {
    key: "social",
    label: "Social",
    icon: "👥",
    glowColor: "shadow-[0_0_16px_rgba(34,211,238,0.2)]",
    borderColor: "border-cyan-400/40",
    textColor: "text-cyan-200",
    bgColor: "bg-cyan-500/10",
  },
  {
    key: "mission",
    label: "Missão",
    icon: "🎯",
    glowColor: "shadow-[0_0_16px_rgba(52,211,153,0.2)]",
    borderColor: "border-emerald-400/40",
    textColor: "text-emerald-200",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "library",
    label: "Biblioteca",
    icon: "📚",
    glowColor: "shadow-[0_0_16px_rgba(236,72,153,0.2)]",
    borderColor: "border-pink-400/40",
    textColor: "text-pink-200",
    bgColor: "bg-pink-500/10",
  },
  {
    key: "profile",
    label: "Perfil",
    icon: "✏️",
    glowColor: "shadow-[0_0_16px_rgba(139,92,246,0.2)]",
    borderColor: "border-violet-400/40",
    textColor: "text-violet-200",
    bgColor: "bg-violet-500/10",
  },
  {
    key: "notifications",
    label: "Avisos",
    icon: "🔔",
    glowColor: "shadow-[0_0_16px_rgba(251,191,36,0.2)]",
    borderColor: "border-yellow-400/40",
    textColor: "text-yellow-200",
    bgColor: "bg-yellow-500/10",
  },
];

type ProfileTabNavProps = {
  walletContent: ReactNode;
  socialContent: ReactNode;
  missionContent: ReactNode;
  libraryContent: ReactNode;
  profileContent: ReactNode;
  notificationsContent: ReactNode;
  notificationCount?: number;
};

export function ProfileTabNav({
  walletContent,
  socialContent,
  missionContent,
  libraryContent,
  profileContent,
  notificationsContent,
  notificationCount = 0,
}: ProfileTabNavProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("wallet");
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);

  const contentMap: Record<TabKey, ReactNode> = {
    wallet: walletContent,
    social: socialContent,
    mission: missionContent,
    library: libraryContent,
    profile: profileContent,
    notifications: notificationsContent,
  };

  const updateIndicator = useCallback(() => {
    const container = tabsRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLButtonElement | null;
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      left: buttonRect.left - containerRect.left + container.scrollLeft,
      width: buttonRect.width,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const activeTabDef = TABS.find(t => t.key === activeTab)!;

  return (
    <div>
      {/* Tab navigation */}
      <div className="relative">
        <div
          ref={tabsRef}
          className="flex gap-0.5 overflow-x-auto scrollbar-hide rounded-2xl border border-slate-800/60 bg-slate-950/90 p-1.5 shadow-[0_8px_24px_rgba(2,6,23,0.25)]"
          role="tablist"
        >
          {/* Sliding indicator */}
          <div
            className={`absolute top-1.5 h-[calc(100%-12px)] rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeTabDef.bgColor} ${activeTabDef.borderColor} ${activeTabDef.glowColor} border`}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              zIndex: 0,
            }}
          />

          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                data-tab={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative z-10 flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-200
                  ${isActive
                    ? `${tab.textColor} font-semibold`
                    : "text-slate-500 hover:text-slate-300"
                  }
                `}
              >
                <span className={`text-sm transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Notification badge */}
                {tab.key === "notifications" && notificationCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/80 px-1 text-[9px] font-bold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-5" role="tabpanel" key={activeTab}>
        {contentMap[activeTab]}
      </div>
    </div>
  );
}
