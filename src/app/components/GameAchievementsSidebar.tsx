"use client";

import Link from "next/link";

type AchievementItem = {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  xpReward: number;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
};

function AchievementMini({ item }: { item: AchievementItem }) {
  return (
    <div
      title={item.title}
      className={`relative flex-shrink-0 w-16 flex flex-col items-center gap-1 ${item.unlocked ? "opacity-100" : "opacity-40 grayscale"}`}
    >
      {item.imageUrl ? (
        <div
          className={`h-12 w-12 rounded-xl border bg-cover bg-center shadow ${item.unlocked ? "border-amber-400/40 shadow-amber-400/20" : "border-slate-700"}`}
          style={{ backgroundImage: `url("${item.imageUrl}")` }}
        />
      ) : (
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl ${item.unlocked ? "border-amber-400/40 bg-amber-400/10" : "border-slate-700 bg-slate-900"}`}>
          {item.icon}
        </div>
      )}
      {item.unlocked && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-slate-950 shadow">✓</span>
      )}
      <p className="text-center text-[9px] leading-tight text-slate-400 line-clamp-2">{item.title}</p>
      {!item.unlocked && (
        <div className="w-full h-0.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${item.progressPercent}%` }} />
        </div>
      )}
    </div>
  );
}

export function GameAchievementsSidebar({ items }: { items: AchievementItem[] }) {
  const unlocked = items.filter((a) => a.unlocked);
  const locked = items.filter((a) => !a.unlocked).sort((a, b) => b.progressPercent - a.progressPercent);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-5">
      {/* Unlocked */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
            🏆 Conquistadas ({unlocked.length})
          </p>
          <Link href="/account" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
            ver todas
          </Link>
        </div>
        {unlocked.length === 0 ? (
          <p className="text-[11px] text-slate-600 text-center py-2">Nenhuma ainda — jogue para desbloquear!</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 snap-x snap-mandatory">
            {unlocked.map((item) => (
              <div key={item.id} className="snap-start">
                <AchievementMini item={item} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* To unlock */}
      {locked.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            🔒 Para Desbloquear
          </p>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 snap-x snap-mandatory">
            {locked.slice(0, 8).map((item) => (
              <div key={item.id} className="snap-start">
                <AchievementMini item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
