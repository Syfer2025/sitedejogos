"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdBlock } from "./AdBlockDetector";
import { useTranslate } from "./LocaleContext";

const COUNTDOWN_SECONDS = 15;

/**
 * Moderate-level response: Full-screen modal with countdown.
 * User must wait 15 seconds before they can dismiss and play.
 */
export function AntiAdBlockModal() {
  const t = useTranslate();
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
          <h2 className="aab-modal-title">{t("adblock.modal.title", {}, "Bloqueador de anúncios detectado")}</h2>
        </div>

        <p className="aab-modal-text">
          {t("adblock.modal.text", {}, "Os anúncios mantêm o Gasty Games gratuito para todos. Enquanto o bloqueador estiver ativo, você precisará aguardar um momento antes de jogar.")}
        </p>

        <div className="aab-modal-benefits">
          <p className="aab-modal-benefits-title">{t("adblock.modal.benefits_title", {}, "Desative o ad blocker e ganhe:")}</p>
          <ul className="aab-modal-benefits-list">
            <li>{t("adblock.modal.benefit_access", {}, "🎮 Acesso instantâneo a todos os jogos")}</li>
            <li>{t("adblock.modal.benefit_countdown", {}, "⚡ Sem contagem regressiva")}</li>
            <li>{t("adblock.modal.benefit_support", {}, "💚 Você apoia o portal gratuitamente")}</li>
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
              {t("adblock.modal.btn_continue", {}, "Continuar para o jogo →")}
            </button>
          ) : (
            <span className="aab-modal-countdown">
              {t("adblock.modal.countdown", { seconds: countdown }, `Aguarde ${countdown}s...`)}
            </span>
          )}

        </div>
      </div>
    </div>
  );
}
