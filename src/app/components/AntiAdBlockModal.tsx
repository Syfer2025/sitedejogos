"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdBlock } from "./AdBlockDetector";

const COUNTDOWN_SECONDS = 15;

/**
 * Moderate-level response: Full-screen modal with countdown.
 * User must wait 15 seconds before they can dismiss and play.
 */
export function AntiAdBlockModal() {
  const { detected, level, dismiss, dismissed } = useAdBlock();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canClose, setCanClose] = useState(false);

  const show = detected && level === "moderate" && !dismissed;

  useEffect(() => {
    if (!show) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [show, countdown]);

  if (!show) return null;

  const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="aab-modal-overlay">
      <div className="aab-modal">
        <div className="aab-modal-header">
          <span className="aab-modal-emoji">⏳</span>
          <h2 className="aab-modal-title">Bloqueador de anúncios detectado</h2>
        </div>

        <p className="aab-modal-text">
          Os anúncios mantêm o Arcade Nexus gratuito para todos. Enquanto o
          bloqueador estiver ativo, você precisará aguardar um momento antes
          de jogar.
        </p>

        <div className="aab-modal-benefits">
          <p className="aab-modal-benefits-title">Desative o ad blocker e ganhe:</p>
          <ul className="aab-modal-benefits-list">
            <li>🎮 Acesso instantâneo a todos os jogos</li>
            <li>⚡ Sem contagem regressiva</li>
            <li>💚 Você apoia o portal gratuitamente</li>
          </ul>
        </div>

        {/* Progress bar */}
        <div className="aab-modal-progress-track">
          <div
            className="aab-modal-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="aab-modal-footer">
          {canClose ? (
            <button type="button" onClick={dismiss} className="aab-modal-continue">
              Continuar para o jogo →
            </button>
          ) : (
            <span className="aab-modal-countdown">
              Aguarde {countdown}s...
            </span>
          )}

          <Link href="/nitro" className="aab-modal-premium">
            ⭐ Assinar Nitro — R$ 8,90/mês — Sem espera, sem anúncios
          </Link>
        </div>
      </div>
    </div>
  );
}
