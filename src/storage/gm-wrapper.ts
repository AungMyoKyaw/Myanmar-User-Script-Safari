// Lightweight wrapper around GM_* APIs with localStorage fallback
// Provides get/set JSON helpers under a single keyspace.

type GMGetValue = (key: string, defaultValue?: unknown) => unknown;
type GMSetValue = (key: string, value: unknown) => void;

declare const GM_getValue: GMGetValue | undefined;
declare const GM_setValue: GMSetValue | undefined;

const hasGM =
  typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

const PREFIX = 'mua:';

export function gmGet<T>(key: string, defaultValue: T): T {
  const full = PREFIX + key;
  try {
    if (hasGM) {
      const v = (GM_getValue as GMGetValue)(full, undefined);
      if (typeof v === 'string') return JSON.parse(v) as T;
      if (v === undefined) return defaultValue;
      return v as T;
    }
    const raw = localStorage.getItem(full);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function gmSet<T>(key: string, value: T): void {
  const full = PREFIX + key;
  const raw = JSON.stringify(value);
  try {
    if (hasGM) {
      (GM_setValue as GMSetValue)(full, raw);
      return;
    }
    localStorage.setItem(full, raw);
  } catch {
    // best-effort; ignore
  }
}
