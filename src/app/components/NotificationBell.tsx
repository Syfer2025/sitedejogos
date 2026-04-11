"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

const KIND_ICON: Record<string, string> = {
  achievement: "🏆",
  level_up: "⬆️",
  streak: "🔥",
  daily_mission: "🎯",
  ranking: "📊",
};

function getIcon(kind: string) {
  return KIND_ICON[kind] ?? "🔔";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      try {
        await fetch("/api/user/notifications", { method: "PATCH" });
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {
        // silent
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
        aria-label="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow shadow-red-500/50">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-[200] w-80 rounded-2xl border border-slate-700/80 bg-slate-950/98 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Notificações</span>
            <span className="text-[10px] text-slate-500">{notifications.filter((n) => !n.isRead).length === 0 ? "Tudo lido" : ""}</span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">Nenhuma notificação ainda.</div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "/account"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors"
                >
                  <span className="mt-0.5 text-base shrink-0">{getIcon(n.kind)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-slate-800 px-4 py-2">
            <Link href="/account" onClick={() => setOpen(false)} className="block text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
              Ver todas no perfil
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
