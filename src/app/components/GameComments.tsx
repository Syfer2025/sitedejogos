"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslate } from "./LocaleContext";
import { AdSlot } from "./AdSlot";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string;
    level: number;
    isPremium: boolean;
    profileTheme: string;
  };
};

type GameCommentsProps = {
  gameId: string;
  isAuthenticated: boolean;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((c) => c.charAt(0).toUpperCase())
    .join("");
}

function timeAgo(dateStr: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("common.now");
  if (minutes < 60) return t("common.minutesAgo", { value: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("common.hoursAgo", { value: hours });
  const days = Math.floor(hours / 24);
  return t("common.daysAgo", { value: days });
}

export function GameComments({ gameId, isAuthenticated }: GameCommentsProps) {
  const t = useTranslate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/user/comments/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setComments(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [gameId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/user/comments/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("comments.errorPosting"));
      setComments((prev) => [data, ...prev]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("comments.errorPosting"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">
          💬 {t("comments.title")} {comments.length > 0 && <span className="text-slate-500 font-normal">({comments.length})</span>}
        </h2>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("comments.placeholder")}
            rows={2}
            maxLength={500}
            className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{content.length}/500</span>
            <button
              type="submit"
              disabled={sending || content.trim().length < 2}
              className="rounded-full bg-purple-600/80 hover:bg-purple-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? t("common.sending") : t("comments.submit")}
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </form>
      ) : (
        <p className="text-xs text-slate-500">
          <a href="/login" className="text-cyan-400 hover:text-cyan-300">{t("comments.loginRequired")}</a>
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">{t("comments.empty")}</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <div className="flex gap-2.5 animate-fade-in-up">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-bold text-slate-300 overflow-hidden">
                {comment.user.avatarUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${comment.user.avatarUrl}')` }}
                  />
                ) : (
                  getInitials(comment.user.displayName)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {comment.user.displayName}
                  </span>
                  <span className="text-[9px] text-slate-500">Lv.{comment.user.level}</span>
                  {comment.user.isPremium && (
                    <span className="text-[9px] text-amber-400 font-bold">★ PRO</span>
                  )}
                  <span className="text-[9px] text-slate-600">{timeAgo(comment.createdAt, t)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 break-words">{comment.content}</p>
              </div>
            </div>
            {index === 2 && comments.length > 3 && (
              <div className="my-2 p-2 rounded-xl border border-slate-800/60 bg-slate-900/40 relative">
                 <span className="absolute top-1 right-2 text-[8px] uppercase text-slate-600">Post Patrocinado</span>
                 <AdSlot
                   label="Comments In-Article Ad"
                   slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE}
                   minHeight={120}
                 />
              </div>
            )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
