"use client";

import { AntiAdBlockBanner } from "./AntiAdBlockBanner";
import { AntiAdBlockModal } from "./AntiAdBlockModal";

/**
 * Client wrapper that renders the appropriate anti-adblock response
 * based on the current level. Can be placed in any server component page.
 */
export function AntiAdBlockGuard() {
  return (
    <>
      <AntiAdBlockBanner />
      <AntiAdBlockModal />
    </>
  );
}
