// Client-side helper to trigger gamification notifications
export const GAMIFICATION_EVENT_NAME = "gamification:new-unlocks";

export type AchievementUnlockData = {
  newlyUnlocked: any[];
  rankChanged: boolean;
  newRank?: number;
};

export function triggerGamificationPopups(data: AchievementUnlockData) {
  if (typeof window === "undefined") return;
  
  const event = new CustomEvent(GAMIFICATION_EVENT_NAME, {
    detail: data
  });
  window.dispatchEvent(event);
}
