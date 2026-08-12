import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { NOTIFICATION_DEFAULT_DURATION_MS, MAX_CONSOLE_LOG_ENTRIES } from "../utils/constants";

const NotificationContext = createContext(null);

let nextId = 1;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const timeouts = useRef(new Map());

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }
  }, []);

  // A single call site drives both the transient toast and the persistent
  // console log — every notify() the app fires is automatically also an
  // application event, with no duplicate bookkeeping at call sites.
  const notify = useCallback(
    (message, { type = "info", duration = NOTIFICATION_DEFAULT_DURATION_MS } = {}) => {
      const id = nextId++;
      setNotifications((prev) => [...prev, { id, message, type }]);
      setLogs((prev) => {
        const next = [...prev, { id, message, type, timestamp: new Date().toISOString() }];
        return next.length > MAX_CONSOLE_LOG_ENTRIES ? next.slice(next.length - MAX_CONSOLE_LOG_ENTRIES) : next;
      });
      if (duration > 0) {
        const timeoutId = setTimeout(() => dismiss(id), duration);
        timeouts.current.set(id, timeoutId);
      }
      return id;
    },
    [dismiss]
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  const value = useMemo(
    () => ({ notifications, notify, dismiss, logs, clearLogs }),
    [notifications, notify, dismiss, logs, clearLogs]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
