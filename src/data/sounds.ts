import type { Sound } from "@/types/sound";

/**
 * Data suara bawaan (built-in).
 * File audio digenerate oleh `scripts/generate-sounds.mjs` ke public/sounds/.
 */
export const BUILT_IN_SOUNDS: Sound[] = [
  {
    id: "airhorn",
    name: "Klakson Meme",
    emoji: "📯",
    category: "Meme",
    src: "/sounds/airhorn.wav",
  },
  {
    id: "vine-boom",
    name: "Vine Boom",
    emoji: "💥",
    category: "Meme",
    src: "/sounds/vine-boom.wav",
  },
  {
    id: "bruh",
    name: "Bruh",
    emoji: "🗿",
    category: "Meme",
    src: "/sounds/bruh.wav",
  },
  {
    id: "record-scratch",
    name: "Record Scratch",
    emoji: "🎧",
    category: "Meme",
    src: "/sounds/record-scratch.wav",
  },
  {
    id: "sad-trombone",
    name: "Trombone Sedih",
    emoji: "🎺",
    category: "Reaksi",
    src: "/sounds/sad-trombone.wav",
  },
  {
    id: "sad-violin",
    name: "Violin Sedih",
    emoji: "🎻",
    category: "Reaksi",
    src: "/sounds/sad-violin.wav",
  },
  {
    id: "tada",
    name: "Tadaa!",
    emoji: "🎉",
    category: "Reaksi",
    src: "/sounds/tada.wav",
  },
  {
    id: "ding",
    name: "Ding Poin",
    emoji: "🔔",
    category: "Reaksi",
    src: "/sounds/ding.wav",
  },
  {
    id: "drum-roll",
    name: "Drum Roll",
    emoji: "🥁",
    category: "Musik",
    src: "/sounds/drum-roll.wav",
  },
  {
    id: "boing",
    name: "Boing!",
    emoji: "🦘",
    category: "Musik",
    src: "/sounds/boing.wav",
  },
];
