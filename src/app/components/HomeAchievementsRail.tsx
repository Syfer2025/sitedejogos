"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { AchievementDefinitionRecord } from "@/data/achievementDefinitionsStore";
import type { AchievementCriteriaType } from "@/lib/gamification";
import { getLocaleContentLocale, type Locale } from "@/lib/locale";

import { TrackedLink } from "./TrackedLink";

const SEEN_ACHIEVEMENTS_STORAGE_KEY = "arcade:achievements:seen";
const SEEN_ACHIEVEMENTS_EVENT = "arcade:achievements:seen-updated";

export type AchievementShowcaseItem = Pick<
  AchievementDefinitionRecord,
  "id" | "key" | "title" | "description" | "icon" | "imageUrl" | "xpReward" | "coinReward" | "criteriaType" | "threshold"
> & {
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
};

export type HomeAchievementRailItem = AchievementShowcaseItem;

function readSeenAchievementsStorage() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.sessionStorage.getItem(SEEN_ACHIEVEMENTS_STORAGE_KEY) ?? "[]";
}

function subscribeSeenAchievements(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key && event.key !== SEEN_ACHIEVEMENTS_STORAGE_KEY) {
      return;
    }

    onChange();
  };
  const handleSeenAchievementsChange = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(SEEN_ACHIEVEMENTS_EVENT, handleSeenAchievementsChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(SEEN_ACHIEVEMENTS_EVENT, handleSeenAchievementsChange);
  };
}

function getAchievementRequirementLabel(
  criteriaType: AchievementCriteriaType,
  threshold: number,
  locale: Locale,
) {
  const number = new Intl.NumberFormat(locale).format(threshold);
  const contentLocale = getLocaleContentLocale(locale);

  if (contentLocale === "en") {
    switch (criteriaType) {
      case "account_created":
        return "Create account";
      case "games_played_total":
        return `${number} total plays`;
      case "unique_games_played":
        return `${number} unique games`;
      case "favorites_total":
        return `${number} favorites`;
      case "current_streak":
        return `${number} day streak`;
      case "profile_completed":
        return "Complete profile";
      case "xp_total":
        return `${number} XP`;
      case "level_reached":
        return `Reach level ${number}`;
      case "ratings_total":
        return `${number} ratings`;
      case "ads_total":
        return `${number} ads viewed`;
      case "comments_total":
        return `${number} comments`;
    }
  }

  if (contentLocale === "es") {
    switch (criteriaType) {
      case "account_created":
        return "Crear cuenta";
      case "games_played_total":
        return `${number} partidas`;
      case "unique_games_played":
        return `${number} juegos únicos`;
      case "favorites_total":
        return `${number} favoritos`;
      case "current_streak":
        return `${number} días seguidos`;
      case "profile_completed":
        return "Completar perfil";
      case "xp_total":
        return `${number} XP`;
      case "level_reached":
        return `Nivel ${number}`;
      case "ratings_total":
        return `${number} valoraciones`;
      case "ads_total":
        return `${number} anuncios vistos`;
      case "comments_total":
        return `${number} comentarios`;
    }
  }

  switch (criteriaType) {
    case "account_created":
      return "Criar conta";
    case "games_played_total":
      return `${number} partidas`;
    case "unique_games_played":
      return `${number} jogos únicos`;
    case "favorites_total":
      return `${number} favoritos`;
    case "current_streak":
      return `${number} dias seguidos`;
    case "profile_completed":
      return "Completar perfil";
    case "xp_total":
      return `${number} XP`;
    case "level_reached":
      return `Nível ${number}`;
    case "ratings_total":
      return `${number} avaliações`;
    case "ads_total":
      return `${number} vídeos assistidos`;
    case "comments_total":
      return `${number} comentários`;
  }
}

function getAchievementUnlockHint(
  item: Pick<HomeAchievementRailItem, "criteriaType" | "currentValue" | "targetValue" | "progressPercent" | "unlocked">,
  locale: Locale,
) {
  const contentLocale = getLocaleContentLocale(locale);

  if (item.unlocked) {
    if (contentLocale === "en") return "Unlocked and already counting toward your profile.";
    if (contentLocale === "es") return "Desbloqueada y ya forma parte de tu perfil.";
    return "Conquista desbloqueada e já contabilizada no seu perfil.";
  }

  if (item.progressPercent >= 100) {
    if (contentLocale === "en") return "Ready to unlock on your next tracked action.";
    if (contentLocale === "es") return "Lista para desbloquearse en tu próxima acción registrada.";
    return "Pronta para desbloquear na sua próxima ação registrada.";
  }

  const remaining = Math.max(item.targetValue - item.currentValue, 0);
  const number = new Intl.NumberFormat(locale).format(remaining);

  if (contentLocale === "en") {
    switch (item.criteriaType) {
      case "account_created":
        return "Create an account to unlock this badge.";
      case "games_played_total":
        return `${number} more play${remaining === 1 ? "" : "s"} to unlock.`;
      case "unique_games_played":
        return `${number} more unique game${remaining === 1 ? "" : "s"} to unlock.`;
      case "favorites_total":
        return `${number} more favorite${remaining === 1 ? "" : "s"} to unlock.`;
      case "current_streak":
        return `${number} more day${remaining === 1 ? "" : "s"} in your streak.`;
      case "profile_completed":
        return "Complete your profile to unlock this badge.";
      case "xp_total":
        return `${number} more XP to unlock.`;
      case "level_reached":
        return `${number} more level${remaining === 1 ? "" : "s"} to unlock.`;
      case "ratings_total":
        return `${number} more rating${remaining === 1 ? "" : "s"} to unlock.`;
      case "ads_total":
        return `${number} more ad view${remaining === 1 ? "" : "s"} to unlock.`;
      case "comments_total":
        return `${number} more comment${remaining === 1 ? "" : "s"} to unlock.`;
    }
  }

  if (contentLocale === "es") {
    switch (item.criteriaType) {
      case "account_created":
        return "Crea una cuenta para desbloquear esta insignia.";
      case "games_played_total":
        return `Faltan ${number} partida${remaining === 1 ? "" : "s"} para desbloquear.`;
      case "unique_games_played":
        return `Faltan ${number} juego${remaining === 1 ? "" : "s"} únicos para desbloquear.`;
      case "favorites_total":
        return `Faltan ${number} favorito${remaining === 1 ? "" : "s"} para desbloquear.`;
      case "current_streak":
        return `Faltan ${number} día${remaining === 1 ? "" : "s"} de racha.`;
      case "profile_completed":
        return "Completa tu perfil para desbloquear esta insignia.";
      case "xp_total":
        return `Faltan ${number} XP para desbloquear.`;
      case "level_reached":
        return `Falta${remaining === 1 ? "" : "n"} ${number} nivel${remaining === 1 ? "" : "es"} para desbloquear.`;
      case "ratings_total":
        return `Falta${remaining === 1 ? "n" : "n"} ${number} valoracion${remaining === 1 ? "es" : "es"} para desbloquear.`;
      case "ads_total":
        return `Falta${remaining === 1 ? "n" : "n"} ${number} anuncio${remaining === 1 ? "" : "s"} para desbloquear.`;
      case "comments_total":
        return `Falta${remaining === 1 ? "n" : "n"} ${number} comentario${remaining === 1 ? "" : "s"} para desbloquear.`;
    }
  }

  switch (item.criteriaType) {
    case "account_created":
      return "Crie uma conta para desbloquear esta insígnia.";
    case "games_played_total":
      return `Faltam ${number} partida${remaining === 1 ? "" : "s"} para desbloquear.`;
    case "unique_games_played":
      return `Faltam ${number} jogo${remaining === 1 ? "" : "s"} únicos para desbloquear.`;
    case "favorites_total":
      return `Faltam ${number} favorito${remaining === 1 ? "" : "s"} para desbloquear.`;
    case "current_streak":
      return `Faltam ${number} dia${remaining === 1 ? "" : "s"} na sua streak.`;
    case "profile_completed":
      return "Complete seu perfil para desbloquear esta insígnia.";
    case "xp_total":
      return `Faltam ${number} XP para desbloquear.`;
    case "level_reached":
      return `Falta${remaining === 1 ? "" : "m"} ${number} ${remaining === 1 ? "nível" : "níveis"} para desbloquear.`;
    case "ratings_total":
      return `Falta${remaining === 1 ? "m" : "m"} ${number} avaliaç${remaining === 1 ? "ão" : "ões"} para desbloquear.`;
    case "ads_total":
      return `Falta${remaining === 1 ? "m" : "m"} ${number} vídeo${remaining === 1 ? "" : "s"} para desbloquear.`;
    case "comments_total":
      return `Falta${remaining === 1 ? "m" : "m"} ${number} comentári${remaining === 1 ? "o" : "os"} para desbloquear.`;
  }
}

function getAchievementTooltipTitle(
  item: Pick<HomeAchievementRailItem, "unlocked" | "progressPercent">,
  locale: Locale,
) {
  const contentLocale = getLocaleContentLocale(locale);

  if (item.unlocked) {
    if (contentLocale === "en") return "Unlocked";
    if (contentLocale === "es") return "Conseguida";
    return "Conquistada";
  }

  if (item.progressPercent >= 100) {
    if (contentLocale === "en") return "Ready to unlock";
    if (contentLocale === "es") return "Lista para desbloquear";
    return "Pronta para desbloquear";
  }

  if (contentLocale === "en") return "Unlock details";
  if (contentLocale === "es") return "Detalle de desbloqueo";
  return "Como desbloquear";
}

function getAchievementTooltipActionLabel(locale: Locale) {
  const contentLocale = getLocaleContentLocale(locale);

  if (contentLocale === "en") return "View unlock details";
  if (contentLocale === "es") return "Ver detalle de desbloqueo";
  return "Ver detalhe de desbloqueio";
}

function getAchievementSealLabel(locale: Locale) {
  const contentLocale = getLocaleContentLocale(locale);

  if (contentLocale === "en") return "Done";
  if (contentLocale === "es") return "Lista";
  return "OK";
}

function AchievementTooltip({
  locale,
  tooltipTitle,
  unlockHint,
  requirementLabel,
  currentValue,
  targetValue,
}: {
  locale: Locale;
  tooltipTitle: string;
  unlockHint: string;
  requirementLabel: string;
  currentValue: number;
  targetValue: number;
}) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 224 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const isCompactViewport = window.innerWidth <= 640;
      const desiredWidth = isCompactViewport ? Math.min(280, window.innerWidth - viewportPadding * 2) : 224;
      const nextWidth = Math.min(desiredWidth, window.innerWidth - viewportPadding * 2);
      const tooltipHeight = tooltipRef.current?.offsetHeight ?? 120;
      const preferAbove = isCompactViewport && rect.top > tooltipHeight + viewportPadding + 8;
      const fitsBelow = rect.bottom + 10 + tooltipHeight <= window.innerHeight - viewportPadding;
      const nextTop = preferAbove || !fitsBelow
        ? Math.max(viewportPadding, rect.top - tooltipHeight - 10)
        : rect.bottom + 10;
      const compactLeftBias = isCompactViewport ? 26 : 0;
      const nextLeft = Math.min(
        Math.max(rect.right - nextWidth - compactLeftBias, viewportPadding),
        window.innerWidth - nextWidth - viewportPadding,
      );

      setPosition({
        top: nextTop,
        left: nextLeft,
        width: nextWidth,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={getAchievementTooltipActionLabel(locale)}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        className="touch-target flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 text-[11px] font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 focus-visible:border-cyan-400/50 focus-visible:text-cyan-100 focus-visible:outline-none"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
      >
        i
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="achievement-tooltip-layer" aria-hidden="true">
              <div
                ref={tooltipRef}
                id={tooltipId}
                role="tooltip"
                aria-hidden="false"
                className="achievement-tooltip-panel achievement-tooltip-panel-open rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-[0_16px_40px_rgba(2,6,23,0.65)] backdrop-blur-md"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${position.width}px`,
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  {tooltipTitle}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{unlockHint}</p>
                <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span>{requirementLabel}</span>
                  <span className="font-semibold text-slate-300">
                    {currentValue}/{targetValue}
                  </span>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function AchievementCard({
  item,
  locale,
  lockedLabel,
  unlockedLabel,
  layout,
  isNewlyUnlocked,
}: {
  item: AchievementShowcaseItem;
  locale: Locale;
  lockedLabel: string;
  unlockedLabel: string;
  layout: "rail" | "grid";
  isNewlyUnlocked: boolean;
}) {
  const requirementLabel = getAchievementRequirementLabel(item.criteriaType, item.threshold, locale);
  const unlockHint = getAchievementUnlockHint(item, locale);
  const tooltipTitle = getAchievementTooltipTitle(item, locale);
  const isComplete = item.progressPercent >= 100;
  const isReadyToUnlock = isComplete && !item.unlocked;
  return (
    <article
      className={`${layout === "rail" ? "min-w-[216px] max-w-[216px] snap-start" : "w-full"} relative rounded-[22px] border p-4 transition-all duration-200 ${
        item.unlocked
          ? "border-amber-400/30 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),rgba(15,23,42,0.96)_58%)] shadow-[0_0_24px_rgba(250,204,21,0.14)]"
          : "border-slate-800 bg-slate-950/70 opacity-45 saturate-0"
      } ${isComplete ? "achievement-card-complete" : ""} ${isReadyToUnlock ? "achievement-card-ready border-fuchsia-300/35 opacity-100 saturate-100" : ""} ${isNewlyUnlocked ? "achievement-card-new-unlock" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          {isNewlyUnlocked ? <span aria-hidden className="achievement-burst" /> : null}

          {item.imageUrl ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
              <div
                role="img"
                aria-label={item.title}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${item.imageUrl}")` }}
              />
            </div>
          ) : (
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border text-xl ${item.unlocked ? "border-amber-400/30 bg-amber-400/10" : "border-slate-700 bg-slate-900"}`}>
              {item.icon}
            </div>
          )}

          {item.unlocked ? (
            <span className={`achievement-seal ${isNewlyUnlocked ? "achievement-seal-pop" : ""}`}>
              {getAchievementSealLabel(locale)}
            </span>
          ) : null}
        </div>

        <div className="flex items-start gap-1.5">
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${isComplete ? "achievement-status-complete" : ""} ${item.unlocked ? "bg-amber-400/15 text-amber-100" : isReadyToUnlock ? "achievement-status-ready bg-fuchsia-400/15 text-fuchsia-100" : "bg-slate-800 text-slate-400"}`}>
            {item.unlocked ? unlockedLabel : lockedLabel}
          </span>

          <AchievementTooltip
            locale={locale}
            tooltipTitle={tooltipTitle}
            unlockHint={unlockHint}
            requirementLabel={requirementLabel}
            currentValue={item.currentValue}
            targetValue={item.targetValue}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-tight">{item.title}</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
          <span className="leading-tight text-slate-500">{requirementLabel}</span>
          <span className={`font-semibold ${item.unlocked ? "text-emerald-200" : "text-slate-300"}`}>
            {item.currentValue}/{item.targetValue}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className={`achievement-progress-fill h-full rounded-full transition-[width] duration-300 ${item.unlocked ? "achievement-progress-fill-unlocked" : "achievement-progress-fill-locked"} ${isComplete ? "achievement-progress-complete" : ""} ${isReadyToUnlock ? "achievement-progress-ready" : ""}`}
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-400">
        <span className={`rounded-full px-2 py-1 font-semibold ${item.unlocked ? "bg-cyan-400/10 text-cyan-100" : "bg-slate-800 text-slate-400"}`}>
          +{item.xpReward} XP
        </span>
        <span className="text-right leading-tight text-slate-500">{item.progressPercent}%</span>
      </div>
    </article>
  );
}

export function AchievementCollection({
  items,
  locale,
  lockedLabel,
  unlockedLabel,
  layout = "rail",
}: {
  items: AchievementShowcaseItem[];
  locale: Locale;
  lockedLabel: string;
  unlockedLabel: string;
  layout?: "rail" | "grid";
}) {
  const unlockedKeys = items
    .filter((item) => item.unlocked)
    .map((item) => item.key)
    .sort();
  const unlockedSignature = unlockedKeys.join("|");
  const seenAchievementsRaw = useSyncExternalStore(
    subscribeSeenAchievements,
    readSeenAchievementsStorage,
    () => "[]",
  );
  const seenAchievements = (() => {
    try {
      const parsed = JSON.parse(seenAchievementsRaw);

      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set<string>();
    }
  })();
  const newlyUnlockedKeys = unlockedKeys.filter((key) => !seenAchievements.has(key));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (newlyUnlockedKeys.length === 0) {
        return;
      }

      const parsed = JSON.parse(seenAchievementsRaw);
      const seenKeys = Array.isArray(parsed) ? parsed : [];
      const nextSeenKeys = Array.from(new Set([...seenKeys, ...unlockedKeys])).sort();
      window.sessionStorage.setItem(
        SEEN_ACHIEVEMENTS_STORAGE_KEY,
        JSON.stringify(nextSeenKeys),
      );
      window.dispatchEvent(new Event(SEEN_ACHIEVEMENTS_EVENT));
    } catch {
      window.sessionStorage.setItem(
        SEEN_ACHIEVEMENTS_STORAGE_KEY,
        JSON.stringify(unlockedKeys),
      );
      window.dispatchEvent(new Event(SEEN_ACHIEVEMENTS_EVENT));
    }
  }, [newlyUnlockedKeys.length, seenAchievementsRaw, unlockedKeys, unlockedSignature]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={layout === "rail" ? "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
      {items.map((item) => (
        <AchievementCard
          key={item.id}
          item={item}
          locale={locale}
          lockedLabel={lockedLabel}
          unlockedLabel={unlockedLabel}
          layout={layout}
          isNewlyUnlocked={newlyUnlockedKeys.includes(item.key)}
        />
      ))}
    </div>
  );
}

export function HomeAchievementsRail({
  items,
  locale,
  isAuthenticated,
  unlockedCount,
  title,
  subtitle,
  lockedLabel,
  unlockedLabel,
  accountCtaLabel,
  guestCtaLabel,
}: {
  items: HomeAchievementRailItem[];
  locale: Locale;
  isAuthenticated: boolean;
  unlockedCount: number;
  title: string;
  subtitle: string;
  lockedLabel: string;
  unlockedLabel: string;
  accountCtaLabel: string;
  guestCtaLabel: string;
}) {
  if (items.length === 0) {
    return null;
  }

  const unlockedItems = items.filter((i) => i.unlocked);
  const lockedItems = items.filter((i) => !i.unlocked);

  return (
    <section className="space-y-6">
      {/* Unlocked Achievements Carousel */}
      {unlockedItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">✨ Conquistas Desbloqueadas</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Seus troféus e marcos alcançados.</p>
            </div>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
              {unlockedCount}
            </span>
          </div>

          <AchievementCollection
            items={unlockedItems}
            locale={locale}
            lockedLabel={lockedLabel}
            unlockedLabel={unlockedLabel}
            layout="rail"
          />
        </div>
      )}

      {/* Locked Achievements Carousel */}
      {lockedItems.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-fuchsia-300/80 font-bold">🎯 Próximos Desafios</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">O que falta para você dominar o portal.</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
              {lockedItems.length}
            </span>
          </div>

          <AchievementCollection
            items={lockedItems}
            locale={locale}
            lockedLabel={lockedLabel}
            unlockedLabel={unlockedLabel}
            layout="rail"
          />
        </div>
      )}

      {!isAuthenticated && (
        <TrackedLink
          href="/login?mode=register"
          trackingPath="/home/achievements/register"
          className="block w-full rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 py-2 text-center text-xs font-semibold text-fuchsia-100 transition-all duration-200 hover:border-fuchsia-300/35 hover:bg-fuchsia-400/15"
        >
          {guestCtaLabel}
        </TrackedLink>
      )}
    </section>
  );
}