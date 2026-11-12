"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NewSoundInput } from "@/hooks/useSounds";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const GIF_EXTENSIONS = ["gif"];

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
];
const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const GIF_MIME_TYPES = ["image/gif"];

const NEW_CATEGORY_VALUE = "__new__";

type MediaType = "audio" | "image" | "gif";

function validateFile(
  file: File | null,
  mediaType: MediaType,
): string | null {
  if (!file) return "File wajib dipilih.";

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type.toLowerCase();

  let allowedExt: string[];
  let allowedMime: string[];
  let label: string;

  if (mediaType === "audio") {
    allowedExt = AUDIO_EXTENSIONS;
    allowedMime = AUDIO_MIME_TYPES;
    label = "mp3, wav, atau ogg";
  } else if (mediaType === "image") {
    allowedExt = IMAGE_EXTENSIONS;
    allowedMime = IMAGE_MIME_TYPES;
    label = "png, jpg, jpeg, atau webp";
  } else {
    allowedExt = GIF_EXTENSIONS;
    allowedMime = GIF_MIME_TYPES;
    label = "gif";
  }

  const typeOk =
    allowedExt.includes(ext) || allowedMime.includes(mime);
  if (!typeOk) {
    return `Format file harus ${label}.`;
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `Ukuran file ${sizeMb}MB melebihi batas maksimal 2MB.`;
  }

  return null;
}

interface AddSoundModalProps {
  open: boolean;
  onClose: () => void;
  /** Dipanggil saat form valid dan siap disimpan. */
  onSubmit: (input: NewSoundInput) => Promise<void>;
  /** Kategori yang sudah ada (untuk select). */
  categories: string[];
}

/**
 * Modal untuk menambah suara baru: nama, kategori, upload audio atau gambar/GIF,
 * dan emoji (opsional untuk gambar/GIF).
 * Bisa ditutup dengan Esc atau klik backdrop, dengan focus trap.
 */
export function AddSoundModal({
  open,
  onClose,
  onSubmit,
  categories,
}: AddSoundModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("audio");
  // Modal dirender kondisional, jadi state awal langsung diisi dari kategori.
  const [category, setCategory] = useState(() => categories[0] ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fokus input pertama saat dibuka + simpan fokus sebelumnya.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(timer);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Kunci scroll body saat modal terbuka.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Bersihkan preview URL saat unmount / file berganti.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleMediaTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setMediaType(event.target.value as MediaType);
      setFile(null);
      setFileError(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    },
    [previewUrl],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null;
      setFile(nextFile);
      setFormError(null);

      const error = validateFile(nextFile, mediaType);
      setFileError(error);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextFile && !error ? URL.createObjectURL(nextFile) : null);
    },
    [mediaType, previewUrl],
  );

  // Esc untuk menutup.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Focus trap: Tab berputar di dalam dialog.
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], audio[controls], img[tabindex], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setFormError(null);

      const trimmedName = name.trim();
      const trimmedEmoji = emoji.trim();
      const finalCategory =
        category === NEW_CATEGORY_VALUE ? newCategory.trim() : category;

      if (!trimmedName) return setFormError("Nama suara wajib diisi.");
      if (!finalCategory) {
        return setFormError(
          category === NEW_CATEGORY_VALUE
            ? "Nama kategori baru wajib diisi."
            : "Kategori wajib dipilih.",
        );
      }

      const error = validateFile(file, mediaType);
      if (error) return setFormError(error);

      if (!previewUrl) {
        return setFormError(
          mediaType === "audio"
            ? "File audio wajib diunggah sebelum disimpan."
            : "Gambar/GIF wajib diunggah sebelum disimpan.",
        );
      }

      const assetType =
        mediaType === "audio" ? "emoji" : mediaType === "image" ? "image" : "gif";

      setIsSubmitting(true);
      try {
        await onSubmit({
          name: trimmedName,
          emoji: trimmedEmoji,
          assetType,
          thumbnail: previewUrl,
          category: finalCategory,
          sourceName: file?.name || undefined,
          file: file as File,
        });
        onClose();
      } catch (submitError) {
        console.error("Gagal menyimpan suara:", submitError);
        setFormError("Gagal menyimpan suara. Coba lagi ya!");
        setIsSubmitting(false);
      }
    },
    [
      name,
      emoji,
      mediaType,
      previewUrl,
      category,
      newCategory,
      file,
      onSubmit,
      onClose,
    ],
  );

  if (!open) return null;

  const inputClassName =
    "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/30";

  const accept =
    mediaType === "audio"
      ? ".mp3,.wav,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg"
      : mediaType === "image"
        ? ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        : ".gif,image/gif";

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        // Klik backdrop (bukan konten dialog) untuk menutup.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
        className="animate-modal-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/15 bg-[#14141f] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-black text-amber-300">
              🔊 Tambah Suara
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-zinc-400">
              Upload efek suara atau ikon suara kamu (maks. 2MB).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/15"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sound-name"
              className="text-xs font-bold uppercase tracking-wide text-zinc-300"
            >
              Nama suara <span className="text-rose-400">*</span>
            </label>
            <input
              id="sound-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="cth: Aduh Ketahuan"
              maxLength={40}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sound-media-type"
              className="text-xs font-bold uppercase tracking-wide text-zinc-300"
            >
              Jenis ikon <span className="text-rose-400">*</span>
            </label>
            <select
              id="sound-media-type"
              value={mediaType}
              onChange={handleMediaTypeChange}
              className={inputClassName}
            >
              <option value="audio">🔊 Emoji (default)</option>
              <option value="image">🖼️ Foto</option>
              <option value="gif">🎞️ GIF</option>
            </select>
          </div>

          {mediaType === "audio" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sound-emoji"
                className="text-xs font-bold uppercase tracking-wide text-zinc-300"
              >
                Emoji <span className="text-rose-400">*</span>
              </label>
              <input
                id="sound-emoji"
                type="text"
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
                placeholder="cth: 🤡"
                maxLength={8}
                className={`${inputClassName} w-28`}
                aria-label="Emoji tombol"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sound-category"
              className="text-xs font-bold uppercase tracking-wide text-zinc-300"
            >
              Kategori <span className="text-rose-400">*</span>
            </label>
            <select
              id="sound-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClassName}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value={NEW_CATEGORY_VALUE}>➕ Buat kategori baru…</option>
            </select>

            {category === NEW_CATEGORY_VALUE && (
              <input
                type="text"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Nama kategori baru"
                maxLength={24}
                aria-label="Nama kategori baru"
                className={inputClassName}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sound-file"
              className="text-xs font-bold uppercase tracking-wide text-zinc-300"
            >
              {mediaType === "audio" ? "File audio" : "File gambar"}
              <span className="text-rose-400">*</span>
            </label>
            <input
              id="sound-file"
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-xs file:font-black file:text-amber-950 hover:file:bg-amber-200"
            />
            <p className="text-xs text-zinc-500">
              {mediaType === "audio"
                ? "Format: mp3 / wav / ogg — maksimal 2MB."
                : mediaType === "image"
                  ? "Format: png / jpg / jpeg / webp — maksimal 2MB."
                  : "Format: gif — maksimal 2MB."}
            </p>
            {fileError && (
              <p role="alert" className="text-xs font-semibold text-rose-400">
                {fileError}
              </p>
            )}
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-300">
                {mediaType === "audio" ? "🔈 Preview" : "👁️ Preview"}
              </p>
              {mediaType === "audio" ? (
                <audio controls src={previewUrl} className="w-full" />
              ) : (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={800}
                  height={400}
                  unoptimized
                  className="w-full rounded-lg object-cover"
                  tabIndex={-1}
                />
              )}
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2.5 text-sm font-semibold text-rose-200"
            >
              ⚠️ {formError}
            </div>
          )}

          <div className="mt-1 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-amber-950 transition hover:bg-amber-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan…" : "💾 Simpan Suara"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

