"use client";

import { useCallback, useState } from "react";
import { AddSoundModal } from "./AddSoundModal";
import { SoundGrid } from "./SoundGrid";
import { useSounds, type NewSoundInput } from "@/hooks/useSounds";
import type { Sound } from "@/types/sound";

/**
 * Papan suara utama: mengelola daftar suara (bawaan + buatan user),
 * membuka modal tambah suara, dan menghapus suara buatan user.
 */
export function Soundboard() {
  const { sounds, categories, isLoaded, addSound, removeSound } = useSounds();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = useCallback(
    async (input: NewSoundInput) => {
      await addSound(input);
    },
    [addSound],
  );

  const handleDelete = useCallback(
    (sound: Sound) => {
      const confirmed = window.confirm(
        `Hapus suara "${(sound.emoji ?? "")} ${sound.name}"? Tindakan ini tidak bisa dibatalkan.`,
      );
      if (!confirmed) return;

      void removeSound(sound.id).catch((error) => {
        console.error("Gagal menghapus suara:", error);
        window.alert("Gagal menghapus suara. Coba lagi ya!");
      });
    },
    [removeSound],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-bold text-zinc-100">Daftar Suara</h2>
          <span className="text-xs font-semibold text-zinc-500">
            {sounds.length} suara
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-fuchsia-400 px-4 py-2.5 text-sm font-black text-fuchsia-950 shadow-lg shadow-fuchsia-500/25 transition hover:bg-fuchsia-300 active:scale-95"
        >
          ＋ Tambah Suara
        </button>
      </div>

      {isLoaded ? (
        <SoundGrid sounds={sounds} onDeleteSound={handleDelete} />
      ) : (
        <SoundGrid sounds={[]} emptyTitle="Memuat suara…" emptyDescription="" />
      )}

      {/* Dirender kondisional supaya state form selalu fresh tiap dibuka. */}
      {isModalOpen && (
        <AddSoundModal
          open
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          categories={categories}
        />
      )}
    </>
  );
}
