import { useCallback, useState } from "react";

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("command"); // 'command' | 'quickopen'

  const open = useCallback((nextMode = "command") => {
    setMode(nextMode);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, mode, open, close };
}
