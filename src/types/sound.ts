/** Tipe untuk satu entri suara di soundboard. */
export interface Sound {
  /** ID unik. */
  id: string;
  /** Nama suara yang ditampilkan di tombol. */
  name: string;
  /** Emoji yang ditampilkan di tombol. */
  emoji: string;
  /** Kategori suara (untuk badge & filter). */
  category: string;
  /** URL file audio — path publik (/sounds/...) atau Blob URL. */
  src: string;
  /** True kalau suara dibuat oleh user (bisa dihapus). */
  isCustom?: boolean;
}
