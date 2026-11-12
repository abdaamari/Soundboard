/** Jenis konten yang bisa disimpan sebagai suara papan suara. */
export type AssetType = "emoji" | "image" | "gif";

/**
 * Tipe untuk satu entri suara di soundboard.
 *
 * - `emoji`: ikon RGBA/unicode (tampil sebagai emoji).
 * - `image`: foto/statis (disimpan thumbnail crop + nama asli).
 * - `gif`: animasi (disimpan thumbnail statis untuk fallback, animasi di-render via <img>).
 */
export interface Sound {
  /** ID unik. */
  id: string;
  /** Nama suara yang ditampilkan di tombol. */
  name: string;
  /** Tipe konten: emoji, foto, atau GIF. */
  assetType: AssetType;
  /** Emoji bila assetType=emoji, fallback tampilan saat belum ada gambar. */
  emoji?: string;
  /** Kotak krop/resize dari file gambar/GIF (base64 data URL / Object URL). Opsional untuk emoji. */
  thumbnail?: string;
  /** Nama/file asli dari file yang diupload (opsional, untuk reference). */
  sourceName?: string;
  /** Kategori suara (untuk badge & filter). */
  category: string;
  /** URL file audio — path publik (/sounds/...) atau Blob URL. */
  src: string;
  /** True kalau suara dibuat oleh user (bisa dihapus). */
  isCustom?: boolean;
}

/** Input saat user menambah suara baru. */
export interface NewSoundInput {
  name: string;
  emoji?: string;
  assetType: AssetType;
  thumbnail: string;
  sourceName?: string;
  category: string;
  file: File;
}
