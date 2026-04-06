"use client";

import { useCallback, useEffect, useState } from "react";

type Friend = {
  id: string;
  friendshipId: string;
  displayName: string;
  avatarUrl: string;
  level: number;
  xp: number;
  currentStreak: number;
  isPremium: boolean;
  profileTheme: string;
};

type PendingRequest = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderLevel: number;
  createdAt: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user/friends");
      if (!res.ok) return;
      const data = await res.json();
      setFriends(data.friends ?? []);
      setPending(data.pending ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendRequest = async () => {
    if (!email.trim()) return;
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erro ao enviar solicitação.");
      } else {
        setMessage("Solicitação enviada!");
        setEmail("");
      }
    } catch {
      setMessage("Erro de conexão.");
    } finally {
      setSending(false);
    }
  };

  const respond = async (id: string, accept: boolean) => {
    await fetch(`/api/user/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: accept ? "accept" : "reject" }),
    });
    void refresh();
  };

  const removeFriend = async (friendshipId: string) => {
    await fetch(`/api/user/friends/${friendshipId}`, { method: "DELETE" });
    void refresh();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-slate-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add friend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
        <h3 className="text-sm font-semibold text-slate-50 mb-3">
          Adicionar amigo
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email do jogador"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none min-h-[40px]"
          />
          <button
            type="button"
            onClick={sendRequest}
            disabled={sending || !email.trim()}
            className="rounded-xl bg-cyan-600/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 min-h-[40px]"
          >
            {sending ? "..." : "Enviar"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-2 text-xs ${message.includes("enviada") ? "text-emerald-400" : "text-red-400"}`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-50 mb-3">
            Solicitações pendentes ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-200">
                  {req.senderAvatar ? (
                    <img
                      src={req.senderAvatar}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(req.senderName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {req.senderName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Lvl {req.senderLevel} • {timeAgo(req.createdAt)} atrás
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respond(req.id, true)}
                    className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 min-h-[36px]"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => respond(req.id, false)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-red-500/50 hover:text-red-300 min-h-[36px]"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <h3 className="text-sm font-semibold text-slate-50 mb-3">
          Amigos ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            Adicione amigos por email para competir no ranking e acompanhar o
            progresso.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-3 transition-colors hover:border-cyan-400/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-200">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(friend.displayName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {friend.displayName}
                    </p>
                    {friend.isPremium && (
                      <span className="text-amber-400 text-[10px]">★</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Lvl {friend.level} • {friend.xp} XP • 🔥 {friend.currentStreak}d
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFriend(friend.friendshipId)}
                  className="rounded-lg border border-slate-700/50 px-2 py-1 text-[10px] text-slate-500 hover:border-red-500/40 hover:text-red-400 transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
