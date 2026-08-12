import { useEffect, useRef } from "react";

function normalizeCombo(event) {
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  const key = event.key.toLowerCase();
  if (key !== "control" && key !== "meta" && key !== "shift") parts.push(key);
  return parts.join("+");
}

// A single document-level listener, keyed by normalized combo string
// ("mod+k", "mod+shift+f", ...). Handlers are read from a ref so callers can
// pass fresh closures each render without re-attaching the listener.
export function useKeyboardShortcuts(shortcuts) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(event) {
      const combo = normalizeCombo(event);
      const handler = shortcutsRef.current[combo];
      if (!handler) return;
      const shouldRun = handler(event);
      if (shouldRun !== false) event.preventDefault();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
