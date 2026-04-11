"use client";

import { useEffect, useState } from "react";
import { GAMIFICATION_EVENT_NAME, type AchievementUnlockData } from "@/lib/gamification-events";

export function GamificationNotifier() {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);

  useEffect(() => {
    function handleUnlocks(event: Event) {
      const { newlyUnlocked, rankChanged, newRank } = (event as CustomEvent<AchievementUnlockData>).detail;
      
      const newItems = [...newlyUnlocked.map(a => ({ ...a, type: "achievement" }))];
      if (rankChanged && newRank) {
        newItems.push({ 
          type: "ranking", 
          title: "Subiu no Ranking!", 
          message: `Você alcançou a posição #${newRank}!`, 
          icon: "🏆" 
        });
      }
      
      setQueue(prev => [...prev, ...newItems]);
    }

    window.addEventListener(GAMIFICATION_EVENT_NAME, handleUnlocks);
    return () => window.removeEventListener(GAMIFICATION_EVENT_NAME, handleUnlocks);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrent(next);
      
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [current, queue]);

  if (!current) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[100] md:bottom-8 md:right-8 animate-achievement-pop">
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/50 bg-slate-950/90 p-4 shadow-[0_0_50px_rgba(251,191,36,0.3)] backdrop-blur-xl max-w-[280px]">
        {/* Progress bar background */}
        <div className="absolute bottom-0 left-0 h-1 bg-amber-400 animate-achievement-timer" />
        
        <div className="flex gap-4 items-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-3xl">
            {current.imageUrl ? (
              <img src={current.imageUrl} className="h-full w-full object-cover rounded-lg" alt="Achievement" />
            ) : (
              <span>{current.icon || "🏅"}</span>
            )}
            <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-lg">
              !
            </div>
          </div>
          
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-0.5">
              {current.type === "ranking" ? "Novo Recorde" : "Conquista Desbloqueada"}
            </p>
            <p className="text-sm font-bold text-white leading-tight mb-1">{current.title}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{current.description || current.message}</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes achievement-pop {
          0% { transform: translateY(20px) scale(0.9); opacity: 0; }
          10% { transform: translateY(0) scale(1.05); opacity: 1; }
          15% { transform: scale(1); }
          85% { transform: scale(1); opacity: 1; }
          100% { transform: translateY(-20px) scale(0.9); opacity: 0; }
        }
        @keyframes achievement-timer {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-achievement-pop {
          animation: achievement-pop 5s ease-in-out forwards;
        }
        .animate-achievement-timer {
          animation: achievement-timer 4.8s linear forwards;
        }
      `}</style>
    </div>
  );
}
