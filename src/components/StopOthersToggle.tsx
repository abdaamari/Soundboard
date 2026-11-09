"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";

/**
 * Toggle opsi "Stop suara lain saat play".
 * Saat aktif, memutar satu suara akan menghentikan suara lain terlebih dulu.
 * Nilainya disimpan di localStorage.
 */
export function StopOthersToggle() {
  const { stopOthersOnPlay, setStopOthersOnPlay } = useAudioPlayer();

  return (
    <label
      className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-300"
      title="Hentikan suara lain saat memutar suara baru"
    >
      <input
        type="checkbox"
        checked={stopOthersOnPlay}
        onChange={(event) => setStopOthersOnPlay(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 rounded-full bg-white/15 transition peer-checked:bg-cyan-400 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0a0a12] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
      />
      <span>Stop suara lain saat play</span>
    </label>
  );
}
