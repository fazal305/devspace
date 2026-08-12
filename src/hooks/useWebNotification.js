import { useCallback } from "react";

const isSupported = typeof window !== "undefined" && "Notification" in window;

// Only fires when the tab is actually hidden — the app already has an
// in-app toast for the visible case, so a native notification is reserved
// for the moment it would genuinely add value (you alt-tabbed away during a
// slower operation like a folder import/export).
export function useWebNotification() {
  const notifyIfHidden = useCallback(async (title, options) => {
    if (!isSupported || document.visibilityState !== "hidden") return;

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission === "granted") new Notification(title, options);
  }, []);

  return { isSupported, notifyIfHidden };
}
