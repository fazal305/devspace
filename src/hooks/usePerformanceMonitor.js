import { useEffect, useState } from "react";

// A tiny module-scoped store (no Context/Provider needed) so any part of the
// app — a worker call, a save, an IndexedDB read — can record a real timing
// and have it show up in the Performance panel without prop drilling.
const MAX_ENTRIES = 20;
let entries = [];
const listeners = new Set();

export function recordPerformanceEntry(label, durationMs) {
  entries = [{ id: crypto.randomUUID(), label, durationMs, timestamp: new Date().toISOString() }, ...entries].slice(
    0,
    MAX_ENTRIES
  );
  listeners.forEach((listener) => listener());
}

export function usePerformanceEntries() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return entries;
}
