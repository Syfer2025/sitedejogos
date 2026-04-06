"use client";

import { useCallback, useState } from "react";

type ShareButtonProps = {
  title: string;
  text?: string;
  className?: string;
};

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [title, text]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-cyan-100 active:scale-95 min-h-[40px]"
      }
    >
      {copied ? "✓ Link copiado!" : "↗ Compartilhar"}
    </button>
  );
}
