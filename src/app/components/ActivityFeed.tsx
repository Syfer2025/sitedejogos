import Image from "next/image";
import Link from "next/link";
import type { listRecentlyPlayed } from "@/data/playerStore";

type HistoryEntry = Awaited<ReturnType<typeof listRecentlyPlayed>>[number];

interface ActivityFeedProps {
  history: HistoryEntry[];
  locale: string;
}

export function ActivityFeed({ history, locale }: ActivityFeedProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-700/60 bg-[#0b0f1e] p-12 text-center shadow-xl">
        <span className="text-4xl text-slate-700">🎮</span>
        <h3 className="mt-4 text-lg font-bold text-slate-300">Nenhuma atividade recente</h3>
        <p className="mt-2 text-sm text-slate-500">Jogue alguns games para ver seu feed ganhar vida!</p>
        <Link href="/" className="mt-6 inline-flex items-center rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-500">
          Explorar Jogos
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700/60 bg-[#0b0f1e] p-6 shadow-2xl h-full flex flex-col">
      <div className="flex flex-col h-full space-y-6 min-h-0">
        <div className="flex items-center justify-between px-2 shrink-0">
          <h2 className="text-xl font-black text-white">Últimas Atividades</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Recentes</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          <div className="grid gap-4">
            {history.map((entry) => (
              <div key={entry.id} className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-black/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Game Thumbnail */}
                  <div className="relative aspect-[2/1] h-16 shrink-0 overflow-hidden rounded-xl border border-slate-800 sm:h-12 md:h-16">
                    <Image
                      src={entry.game.thumbnail}
                      alt={entry.game.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-widest text-cyan-400">JOGADO</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] font-bold text-slate-500">
                        {new Date(entry.lastPlayedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                      {entry.game.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                       {entry.playCount} partidas • ⚡ +15 XP
                    </p>
                  </div>

                  {/* Action */}
                  <Link
                    href={`/games/${entry.game.slug}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 px-4 text-[10px] font-black text-white border border-slate-700 transition-all hover:bg-white hover:text-slate-950 hover:scale-105 active:scale-95 sm:ml-auto"
                  >
                    JOGAR
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {history.length > 5 && (
          <div className="shrink-0 pt-2">
            <button className="w-full rounded-2xl border border-slate-700/60 bg-slate-800 py-3 text-[11px] font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600">
              CARREGAR MAIS ATIVIDADES
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
