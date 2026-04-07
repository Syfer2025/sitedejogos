"use client";

import Link from "next/link";
import { useAdBlock } from "./AdBlockDetector";

/**
 * Soft-level response: A dismissible banner shown at the top of content.
 * Friendly tone, doesn't block anything.
 */
export function AntiAdBlockBanner() {
  const { detected, level, dismiss, dismissed } = useAdBlock();

  if (!detected || level !== "soft" || dismissed) return null;

  return (
    <div className="aab-banner">
      <div className="aab-banner-inner">
        <div className="aab-banner-icon">🛡️</div>
        <div className="aab-banner-text">
          <p className="aab-banner-title">
            Notamos que você usa um bloqueador de anúncios
          </p>
          <p className="aab-banner-desc">
            Os anúncios são a única fonte de receita do Arcade Nexus e mantêm os jogos
            100% gratuitos. Considere desativar o ad blocker para apoiar o portal!
          </p>
        </div>
        <div className="aab-banner-actions">
          <Link href="/nitro" className="aab-banner-premium">
            ⭐ Nitro Premium — sem anúncios
          </Link>
          <button type="button" onClick={dismiss} className="aab-banner-close" aria-label="Fechar">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
