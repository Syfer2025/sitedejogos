"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdBlock } from "./AdBlockDetector";

const HARD_COUNTDOWN = 30;
const DAILY_LIMIT = 3;

/**
 * Hard-level response: Shown inside the game player area.
 * 30s countdown + daily game limit (3 games/day with adblock).
 * If limit reached, must disable adblock or subscribe Nitro.
 */
export function AntiAdBlockWall({
  onAllow,
}: {
  /** Called when user is allowed to play (countdown finished) */
  onAllow: () => void;
}) {
  const { level, gamesPlayedToday, canPlay, registerGamePlay } = useAdBlock();
  const [countdown, setCountdown] = useState(HARD_COUNTDOWN);
  const [allowed, setAllowed] = useState(false);

  const isBlocked = !canPlay;
  const remaining = DAILY_LIMIT - gamesPlayedToday;

  useEffect(() => {
    if (isBlocked || allowed) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setAllowed(true);
      registerGamePlay();
      onAllow();
    }
  }, [countdown, isBlocked, allowed, registerGamePlay, onAllow]);

  if (level !== "hard") return null;

  const progress = ((HARD_COUNTDOWN - countdown) / HARD_COUNTDOWN) * 100;

  // Daily limit reached
  if (isBlocked) {
    return (
      <div className="aab-wall">
        <div className="aab-wall-content">
          <span className="aab-wall-emoji">🚫</span>
          <h2 className="aab-wall-title">Limite diário atingido</h2>
          <p className="aab-wall-text">
            Com o bloqueador de anúncios ativo, o limite é de{" "}
            <strong>{DAILY_LIMIT} jogos por dia</strong>. Você já jogou{" "}
            {gamesPlayedToday} hoje.
          </p>

          <div className="aab-wall-options">
            <div className="aab-wall-option">
              <p className="aab-wall-option-desc">
                Desative seu bloqueador de anúncios e recarregue a página para
                jogar sem limites.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="aab-wall-btn-reload"
              >
                🔄 Já desativei, recarregar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Countdown in progress
  if (!allowed) {
    return (
      <div className="aab-wall">
        <div className="aab-wall-content">
          <span className="aab-wall-emoji">⏳</span>
          <h2 className="aab-wall-title">Aguarde para jogar</h2>
          <p className="aab-wall-text">
            Bloqueador de anúncios detectado. Aguarde a contagem para jogar.
            <br />
            <span className="aab-wall-remaining">
              Restam <strong>{remaining}</strong> jogo{remaining !== 1 ? "s" : ""} hoje com ad blocker
            </span>
          </p>

          <div className="aab-wall-countdown-ring">
            <svg viewBox="0 0 100 100" className="aab-wall-ring-svg">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(51,65,85,0.3)"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#aab-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                className="aab-wall-ring-progress"
              />
              <defs>
                <linearGradient id="aab-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="aab-wall-countdown-text">{countdown}</span>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
