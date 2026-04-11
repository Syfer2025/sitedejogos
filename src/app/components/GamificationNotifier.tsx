"use client";

import { useEffect, useRef, useState } from "react";
import { GAMIFICATION_EVENT_NAME, type AchievementUnlockData } from "@/lib/gamification-events";

function playAchievementSound() {
  if (typeof window === "undefined") return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    // First note - bright chime
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second note - higher
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.22);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc2.connect(gain2).connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);

    // Third note - sparkle
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(1567.98, now + 0.24);
    osc3.frequency.exponentialRampToValueAtTime(2093, now + 0.35);
    gain3.gain.setValueAtTime(0.15, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc3.connect(gain3).connect(audioCtx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.6);
  } catch {
    // Audio not available
  }
}

export function GamificationNotifier() {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const hasPlayedSoundForCurrent = useRef<Set<string>>(new Set());

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
      hasPlayedSoundForCurrent.current.clear();

      // Play achievement sound
      playAchievementSound();

      const timer = setTimeout(() => {
        setCurrent(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [current, queue]);

  if (!current) return null;

  const uniqueKey = `${current.type}-${current.id || current.title}-${current.unlockedAt || ''}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-achievement-backdrop" />

      {/* Card */}
      <div className="relative pointer-events-auto animate-achievement-pop-center">
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-[0_0_80px_rgba(251,191,36,0.35)] backdrop-blur-xl max-w-[360px] w-full">
          {/* Decorative corner glows */}
          <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-amber-400/20 blur-[40px]" />
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-400/15 blur-[40px]" />

          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 animate-achievement-timer rounded-b-3xl" />

          <div className="flex gap-5 items-center relative">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-amber-400/15 text-4xl shadow-lg shadow-amber-400/20">
              {current.imageUrl ? (
                <img src={current.imageUrl} className="h-full w-full object-cover rounded-xl" alt="Achievement" />
              ) : (
                <span>{current.icon || "🏅"}</span>
              )}
              <div className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center text-xs font-bold text-slate-900 shadow-lg animate-pulse">
                !
              </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-1 flex items-center gap-2">
                <span className="inline-block w-5 h-px bg-amber-400/50" />
                {current.type === "ranking" ? "Novo Recorde" : "Conquista Desbloqueada"}
                <span className="inline-block w-5 h-px bg-amber-400/50" />
              </p>
              <p className="text-base font-black text-white leading-tight mb-1 truncate">{current.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{current.description || current.message}</p>
              {current.xpReward && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-500/20">+{current.xpReward} XP</span>
                  {current.coinReward > 0 && (
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/20">+{current.coinReward} 🪙</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes achievement-pop-center {
          0% { transform: scale(0.7) translateY(30px); opacity: 0; }
          15% { transform: scale(1.08) translateY(-5px); opacity: 1; }
          25% { transform: scale(1); }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9) translateY(-15px); opacity: 0; }
        }
        @keyframes achievement-backdrop {
          0% { opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes achievement-timer {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-achievement-pop-center {
          animation: achievement-pop-center 5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-achievement-backdrop {
          animation: achievement-backdrop 5s ease-in-out forwards;
        }
        .animate-achievement-timer {
          animation: achievement-timer 4.8s linear forwards;
        }
      `}</style>
    </div>
  );
}
