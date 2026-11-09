"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";

/**
 * Tombol "Stop All" — menghentikan semua suara yang sedang diputar.
 * Otomatis nonaktif kalau tidak ada suara yang berjalan.
 */
export function StopAllButton() {
  const { playingIds, stopAll } = useAudioPlayer();
  const activeCount = playingIds.size;

  return (
    <button
      type="button"
      onClick={stopAll}
      disabled={activeCount === 0}
      className="flex h-9 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      title={
        activeCount > 0
          ? `Hentikan ${activeCount} suara yang sedang diputar`
          : "Tidak ada suara yang diputar"
      }
    >
      <span aria-hidden="true">⏹</span>
      Stop All
      {activeCount > 0 && (
        <span className="rounded-full bg-rose-400/30 px-1.5 text-[10px] tabular-nums">
          {activeCount}
        </span>
      )}
    </button>
  );
}
