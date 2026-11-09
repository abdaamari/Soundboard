"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";

/**
 * Slider volume master (0-100%) + tombol mute.
 * Nilainya disimpan di localStorage lewat useAudioPlayer.
 */
export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = useAudioPlayer();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={muted}
        aria-label={muted ? "Aktifkan suara" : "Bisukan suara"}
        title={muted ? "Aktifkan suara" : "Bisukan suara"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg transition hover:bg-white/15 active:scale-95"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <label className="flex flex-1 items-center gap-2">
        <span className="sr-only">Volume master</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume master"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-300"
        />
        <span
          className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-zinc-300"
          aria-hidden="true"
        >
          {muted ? 0 : volume}%
        </span>
      </label>
    </div>
  );
}
