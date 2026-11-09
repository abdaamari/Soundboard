"use client";

import type { Sound } from "@/types/sound";
import { SoundButton } from "./SoundButton";

interface SoundGridProps {
  sounds: Sound[];
  /** Dipakai suara buatan user untuk menghapus. */
  onDeleteSound?: (sound: Sound) => void;
  /** Pesan empty state (default: suara belum ada sama sekali). */
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Grid responsif tombol suara: 2 kolom di mobile, sampai 6 kolom di desktop.
 */
export function SoundGrid({
  sounds,
  onDeleteSound,
  emptyTitle = "Belum ada suara nih 😭",
  emptyDescription = "Tambahkan suara pertama kamu lewat tombol “+ Tambah Suara” di atas!",
}: SoundGridProps) {
  if (sounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center">
        <span aria-hidden="true" className="text-6xl">
          🦗
        </span>
        <p className="text-lg font-bold text-zinc-200">{emptyTitle}</p>
        {emptyDescription && (
          <p className="max-w-sm text-sm text-zinc-400">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {sounds.map((sound) => (
        <SoundButton
          key={sound.id}
          sound={sound}
          onDelete={
            onDeleteSound && sound.isCustom
              ? () => onDeleteSound(sound)
              : undefined
          }
        />
      ))}
    </div>
  );
}
