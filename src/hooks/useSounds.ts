"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BUILT_IN_SOUNDS } from "@/data/sounds";
import {
  deleteStoredSound,
  getAllStoredSounds,
  putStoredSound,
} from "@/data/soundStorage";
import type { Sound } from "@/types/sound";

export interface NewSoundInput {
  name: string;
  emoji?: string;
  assetType: "emoji" | "image" | "gif";
  thumbnail: string;
  category: string;
  sourceName?: string;
  /** File audio hasil upload (mp3/wav/ogg, maks 2MB). */
  file: File;
}

interface UseSoundsResult {
  /** Semua suara: bawaan lalu buatan user. */
  sounds: Sound[];
  /** Daftar kategori unik dari semua suara. */
  categories: string[];
  /** True setelah data dari IndexedDB selesai dimuat. */
  isLoaded: boolean;
  /** Tambah suara baru (tersimpan permanen di IndexedDB). */
  addSound: (input: NewSoundInput) => Promise<Sound>;
  /** Hapus suara buatan user. */
  removeSound: (id: string) => Promise<void>;
}

const ID_PREFIX = "custom-";

/**
 * Mengelola daftar suara: bawaan (statik) + buatan user (IndexedDB).
 * File audio user dijadikan Blob URL saat dimuat.
 */
export function useSounds(): UseSoundsResult {
  const [customSounds, setCustomSounds] = useState<Sound[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simpan Blob URL supaya bisa direvoke saat unmount / hapus.
  const blobUrlsRef = useRef(new Map<string, string>());

  const revokeUrl = useCallback((id: string) => {
    const url = blobUrlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(id);
    }
  }, []);

  // Muat suara user dari IndexedDB saat mount.
  useEffect(() => {
    let cancelled = false;
    // Salin referensi map di badan effect (stable) untuk dipakai di cleanup.
    const urls = blobUrlsRef.current;

    (async () => {
      try {
        const stored = await getAllStoredSounds();
        if (cancelled) return;

        const loaded: Sound[] = stored.map((record) => {
          const url = URL.createObjectURL(record.audio);
          urls.set(record.id, url);
          return {
            id: record.id,
            name: record.name,
            assetType: record.assetType,
            emoji: record.emoji,
            thumbnail: record.thumbnail,
            sourceName: record.sourceName,
            category: record.category,
            src: url,
            isCustom: true,
          };
        });
        setCustomSounds(loaded);
      } catch (error) {
        console.error("Gagal memuat suara dari IndexedDB:", error);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
      // Bersihkan semua Blob URL saat unmount.
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const addSound = useCallback(async (input: NewSoundInput): Promise<Sound> => {
    const id = `${ID_PREFIX}${crypto.randomUUID()}`;
    const record = {
      id,
      name: input.name.trim(),
      assetType: input.assetType,
      emoji: input.emoji?.trim(),
      thumbnail: input.thumbnail,
      sourceName: input.sourceName?.trim() || undefined,
      category: input.category.trim(),
      audio: input.file,
      createdAt: Date.now(),
    };

    await putStoredSound(record);

    const url = URL.createObjectURL(record.audio);
    blobUrlsRef.current.set(id, url);

    const sound: Sound = {
      id,
      name: record.name,
      assetType: record.assetType,
      emoji: record.emoji,
      thumbnail: record.thumbnail,
      sourceName: record.sourceName,
      category: record.category,
      src: url,
      isCustom: true,
    };

    setCustomSounds((prev) => [...prev, sound]);
    return sound;
  }, []);

  const removeSound = useCallback(
    async (id: string) => {
      await deleteStoredSound(id);
      revokeUrl(id);
      setCustomSounds((prev) => prev.filter((sound) => sound.id !== id));
    },
    [revokeUrl],
  );

  const sounds = useMemo(
    () => [...BUILT_IN_SOUNDS, ...customSounds],
    [customSounds],
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const sound of sounds) {
      if (!seen.has(sound.category)) {
        seen.add(sound.category);
        list.push(sound.category);
      }
    }
    return list;
  }, [sounds]);

  return { sounds, categories, isLoaded, addSound, removeSound };
}
