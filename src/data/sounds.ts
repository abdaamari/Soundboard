import type { Sound } from "@/types/sound";

/**
 * Data suara bawaan (built-in).
 * File audio digenerate oleh `scripts/generate-sounds.mjs` ke public/sounds/.
 */
export const BUILT_IN_SOUNDS: Sound[] = [
  {
    id: "airhorn",
    name: "Klakson Meme",
    assetType: "emoji",
    emoji: "📯",
    category: "Meme",
    src: "/sounds/airhorn.wav",
  },
  {
    id: "vine-boom",
    name: "Vine Boom",
    assetType: "emoji",
    emoji: "💥",
    category: "Meme",
    src: "/sounds/vine-boom.wav",
  },
  {
    id: "bruh",
    name: "Bruh",
    assetType: "emoji",
    emoji: "🗿",
    category: "Meme",
    src: "/sounds/bruh.wav",
  },
  {
    id: "record-scratch",
    name: "Record Scratch",
    assetType: "emoji",
    emoji: "🎧",
    category: "Meme",
    src: "/sounds/record-scratch.wav",
  },
  {
    id: "sad-trombone",
    name: "Trombone Sedih",
    assetType: "emoji",
    emoji: "🎺",
    category: "Reaksi",
    src: "/sounds/sad-trombone.wav",
  },
  {
    id: "sad-violin",
    name: "Violin Sedih",
    assetType: "emoji",
    emoji: "🎻",
    category: "Reaksi",
    src: "/sounds/sad-violin.wav",
  },
  {
    id: "tada",
    name: "Tadaa!",
    assetType: "emoji",
    emoji: "🎉",
    category: "Reaksi",
    src: "/sounds/tada.wav",
  },
  {
    id: "ding",
    name: "Ding Poin",
    assetType: "emoji",
    emoji: "🔔",
    category: "Reaksi",
    src: "/sounds/ding.wav",
  },
  {
    id: "drum-roll",
    name: "Drum Roll",
    assetType: "emoji",
    emoji: "🥁",
    category: "Musik",
    src: "/sounds/drum-roll.wav",
  },
  {
    id: "boing",
    name: "Boing!",
    assetType: "emoji",
    emoji: "🦘",
    category: "Musik",
    src: "/sounds/boing.wav",
  },
];
