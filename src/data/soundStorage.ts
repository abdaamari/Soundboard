/**
 * Penyimpanan suara buatan user di IndexedDB.
 *
Metadata + file audio (Blob) + thumbnail gambar/GIF disimpan di browser, jadi
 * suara tetap ada setelah reload tanpa backend.
 */

const DB_NAME = "meme-soundboard-tim";
const DB_VERSION = 1;
const STORE_NAME = "sounds";

/** Catatan yang disimpan di IndexedDB. */
export interface StoredSound {
  id: string;
  name: string;
  /** Jenis konten: emoji, foto, atau GIF. */
  assetType: "emoji" | "image" | "gif";
  /** Emoji bila assetType=emoji, fallback tampilan saat belum ada gambar. */
  emoji?: string;
  /** Thumbnail gambar/GIF (base64 data URL atau Object URL). */
  thumbnail: string;
  /** Nama/file asli dari file yang diupload. */
  sourceName?: string;
  category: string;
  /** File audio mentah (mp3/wav/ogg). */
  audio: Blob;
  createdAt: number;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Database dibuka oleh tab lain."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  if (!isIndexedDbAvailable()) {
    throw new Error("IndexedDB tidak tersedia di browser ini.");
  }
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/** Ambil semua suara buatan user (terbaru di akhir). */
export async function getAllStoredSounds(): Promise<StoredSound[]> {
  const all = await withStore<StoredSound[]>("readonly", (store) =>
    store.getAll() as IDBRequest<StoredSound[]>,
  );
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

/** Simpan (insert/update) satu suara. */
export async function putStoredSound(sound: StoredSound): Promise<void> {
  await withStore("readwrite", (store) => store.put(sound));
}

/** Hapus satu suara berdasarkan ID. */
export async function deleteStoredSound(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}
