"use client";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-lg font-bold text-white">Erro ao carregar a conta</p>
      <p className="text-sm text-slate-400">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500"
      >
        Tentar novamente
      </button>
    </div>
  );
}
