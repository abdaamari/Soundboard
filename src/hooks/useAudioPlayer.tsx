"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface PlayableSound {
  id: string;
  src: string;
}

interface AudioPlayerContextValue {
  /** ID suara yang sedang diputar saat ini (bisa lebih dari satu / overlap). */
  playingIds: ReadonlySet<string>;
  /** Volume master dalam persen (0-100). */
  volume: number;
  /** Apakah output sedang dibisukan. */
  muted: boolean;
  /** Kalau aktif, memutar suara baru akan menghentikan suara lain dulu. */
  stopOthersOnPlay: boolean;
  /** Status "sedang diputar" untuk satu suara. */
  isPlaying: (id: string) => boolean;
  /** Putar suara. Kalau sedang diputar, mulai ulang dari awal (restart). */
  play: (sound: PlayableSound) => void;
  /** Hentikan satu suara. */
  stop: (id: string) => void;
  /** Hentikan semua suara yang sedang diputar. */
  stopAll: () => void;
  setVolume: (percent: number) => void;
  toggleMute: () => void;
  setStopOthersOnPlay: (enabled: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const VOLUME_STORAGE_KEY = "meme-soundboard:volume";
const MUTED_STORAGE_KEY = "meme-soundboard:muted";
const STOP_OTHERS_STORAGE_KEY = "meme-soundboard:stop-others-on-play";

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 100;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [volume, setVolumeState] = useLocalStorage<number>(
    VOLUME_STORAGE_KEY,
    100,
  );
  const [muted, setMuted] = useLocalStorage<boolean>(MUTED_STORAGE_KEY, false);
  const [stopOthersOnPlay, setStopOthersOnPlay] = useLocalStorage<boolean>(
    STOP_OTHERS_STORAGE_KEY,
    false,
  );

  const [playingIds, setPlayingIds] = useState<ReadonlySet<string>>(new Set());

  // Simpan elemen audio di ref supaya tidak memicu re-render tiap kali.
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());

  // Nilai volume terbaru dibaca lewat ref agar callback `play` tidak basi.
  const effectiveVolume = muted ? 0 : clampPercent(volume) / 100;
  const volumeRef = useRef(effectiveVolume);
  const stopOthersRef = useRef(stopOthersOnPlay);
  useEffect(() => {
    volumeRef.current = effectiveVolume;
  }, [effectiveVolume]);
  useEffect(() => {
    stopOthersRef.current = stopOthersOnPlay;
  }, [stopOthersOnPlay]);

  const markStopped = useCallback((id: string) => {
    setPlayingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const stop = useCallback(
    (id: string) => {
      const audio = audioRefs.current.get(id);
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      markStopped(id);
    },
    [markStopped],
  );

  const stopAll = useCallback(() => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingIds(new Set());
  }, []);

  const play = useCallback(
    (sound: PlayableSound) => {
      // Opsi "stop suara lain saat play": hentikan semua dulu.
      if (stopOthersRef.current) {
        audioRefs.current.forEach((audio, id) => {
          if (id !== sound.id) {
            audio.pause();
            audio.currentTime = 0;
            markStopped(id);
          }
        });
      }

      let audio = audioRefs.current.get(sound.id);
      if (!audio) {
        audio = new Audio(sound.src);
        audio.preload = "auto";
        audioRefs.current.set(sound.id, audio);

        audio.addEventListener("ended", () => markStopped(sound.id));
        audio.addEventListener("error", () => markStopped(sound.id));
      }

      audio.volume = volumeRef.current;

      // Ditekan lagi saat sedang diputar → restart dari awal.
      audio.currentTime = 0;
      setPlayingIds((prev) => new Set(prev).add(sound.id));

      void audio
        .play()
        .catch(() => {
          // Play gagal (mis. autoplay policy) — kembalikan state ke tenang.
          markStopped(sound.id);
        });
    },
    [markStopped],
  );

  const setVolume = useCallback(
    (percent: number) => {
      const next = clampPercent(percent);
      setVolumeState(next);
    },
    [setVolumeState],
  );

  const toggleMute = useCallback(() => setMuted((prev) => !prev), [setMuted]);

  // Terapkan volume ke semua elemen audio yang sedang hidup.
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = effectiveVolume;
    });
  }, [effectiveVolume]);

  // Bersihkan semua audio saat komponen unmount.
  useEffect(() => {
    const refs = audioRefs.current;
    return () => {
      refs.forEach((audio) => audio.pause());
      refs.clear();
    };
  }, []);

  const isPlaying = useCallback(
    (id: string) => playingIds.has(id),
    [playingIds],
  );

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      playingIds,
      volume: clampPercent(volume),
      muted,
      stopOthersOnPlay,
      isPlaying,
      play,
      stop,
      stopAll,
      setVolume,
      toggleMute,
      setStopOthersOnPlay,
    }),
    [
      playingIds,
      volume,
      muted,
      stopOthersOnPlay,
      isPlaying,
      play,
      stop,
      stopAll,
      setVolume,
      toggleMute,
      setStopOthersOnPlay,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

/**
 * Akses player suara global. Harus dipakai di dalam `AudioPlayerProvider`.
 */
export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      "useAudioPlayer harus dipakai di dalam <AudioPlayerProvider>",
    );
  }
  return context;
}
