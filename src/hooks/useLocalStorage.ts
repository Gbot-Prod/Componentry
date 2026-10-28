import { useEffect, useState } from "react";

/**
 * useState that survives page reloads. Falls back to `initialValue` when
 * storage is unavailable (private mode) or the saved JSON is corrupt.
 * `initialValue` may be a function, called only when nothing is saved.
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    // Like useState, a function initial value is only called when it's needed.
    const fallback = () => (initialValue instanceof Function ? initialValue() : initialValue);
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? fallback() : (JSON.parse(saved) as T);
    } catch {
      return fallback();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked — state still works for this session.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
