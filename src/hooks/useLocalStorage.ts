"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook untuk menyimpan & membaca nilai di localStorage dengan aman
 * dari hydration mismatch (SSR) memakai `useSyncExternalStore`.
 *
 * Catatan: untuk satu `key`, `initialValue` harus konsisten (pakai
 * primitive / konstanta) supaya semua pemakai key tersebut sinkron.
 */

type Listener = () => void;

const listenersByKey = new Map<string, Set<Listener>>();
const cacheByKey = new Map<string, unknown>();

function subscribe(key: string, listener: Listener) {
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
  };
}

function notify(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function readValue<T>(key: string, fallback: T): T {
  if (cacheByKey.has(key)) return cacheByKey.get(key) as T;

  let value = fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) value = JSON.parse(raw) as T;
  } catch {
    // Storage tidak tersedia / korup — pakai fallback.
  }
  cacheByKey.set(key, value);
  return value;
}

function writeValue<T>(key: string, value: T) {
  cacheByKey.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage penuh / diblokir — nilai tetap hidup di memori.
  }
  notify(key);
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => readValue(key, initialValue),
    () => initialValue,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(readValue(key, initialValue))
          : next;
      writeValue(key, resolved);
    },
    [key, initialValue],
  );

  return [value, setValue] as const;
}
