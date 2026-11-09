"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { Sound } from "@/types/sound";

/** Warna badge per kategori (dipilih dari hash nama kategori supaya stabil). */
const CATEGORY_STYLES = [
  "bg-fuchsia-400/20 text-fuchsia-200 border-fuchsia-400/30",
  "bg-cyan-400/20 text-cyan-200 border-cyan-400/30",
  "bg-lime-400/20 text-lime-200 border-lime-400/30",
  "bg-amber-400/20 text-amber-200 border-amber-400/30",
  "bg-rose-400/20 text-rose-200 border-rose-400/30",
  "bg-indigo-400/20 text-indigo-200 border-indigo-400/30",
];

function categoryStyle(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

interface SoundButtonProps {
  sound: Sound;
  /** Munculkan tombol hapus (khusus suara buatan user). */
  onDelete?: () => void;
}

/**
 * Tombol satu suara: emoji, nama, kategori, dan indikator saat diputar.
 */
export function SoundButton({ sound, onDelete }: SoundButtonProps) {
  const { play, isPlaying } = useAudioPlayer();
  const playing = isPlaying(sound.id);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => play({ id: sound.id, src: sound.src })}
        aria-pressed={playing}
        aria-label={`${playing ? "Ulangi" : "Putar"} suara ${sound.name}`}
        className={[
          "flex w-full flex-col items-center gap-2 rounded-2xl border p-4 text-center transition",
          "active:scale-95",
          playing
            ? "animate-sound-pulse border-amber-300/70 bg-amber-300/15"
            : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="text-4xl leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        >
          {sound.emoji}
        </span>

        <span className="line-clamp-2 text-sm font-semibold text-zinc-100">
          {sound.name}
        </span>

        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryStyle(sound.category)}`}
        >
          {sound.category}
        </span>

        {playing && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-950"
          >
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-950" />
            main
          </span>
        )}
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus suara ${sound.name}`}
          title="Hapus suara ini"
          className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/90 text-xs font-black text-white opacity-0 transition hover:bg-rose-500 focus-visible:opacity-100 group-hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
