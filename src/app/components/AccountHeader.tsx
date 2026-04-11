"use client";

import { useState } from "react";
import { AccountProfileForm } from "./AccountProfileForm";

export function AccountHeader({ 
  profile, 
  playerInitials, 
  memberSince, 
  tr, 
  dict, 
  logoutAction,
  categories
}: { 
  profile: any, 
  playerInitials: string, 
  memberSince: string, 
  tr: any, 
  dict: any, 
  logoutAction: any,
  categories: string[]
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-slate-700/60 bg-[#080c18] shadow-2xl">
      <div className="h-48 md:h-64 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
          style={profile.coverUrl ? { backgroundImage: `url("${profile.coverUrl}")` } : { backgroundImage: `linear-gradient(to tr, #050816, #0e1530, #1e1b4b)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-transparent to-transparent" />
      </div>
      
      <div className="px-6 pb-8 md:px-10">
        <div className="relative -mt-20 flex flex-col items-center gap-6 md:-mt-24 md:flex-row md:items-end">
          <div
               className="h-40 w-40 flex items-center justify-center rounded-full border-4 border-[#080c18] bg-gradient-to-br from-cyan-400 to-purple-600 shadow-2xl text-4xl font-black text-white shrink-0 ring-2 ring-indigo-500/50"
               style={profile.avatarUrl ? { backgroundImage: `url("${profile.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {!profile.avatarUrl && playerInitials}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <h1 className="text-3xl font-black text-white md:text-4xl tracking-tight">{profile.displayName}</h1>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-full bg-slate-800/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-all"
              >
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              {profile.email} • {memberSince}
            </p>
          </div>

          <form action={logoutAction} className="shrink-0 mb-2">
             <button
               type="submit"
               className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-2.5 text-xs font-bold text-slate-200 transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
             >
               Sair
             </button>
          </form>
        </div>

        {isEditing && (
          <div className="mt-12 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 animate-fade-in">
            <AccountProfileForm 
              initialProfile={profile}
              categories={categories}
            />
          </div>
        )}
      </div>
    </header>
  );
}
