import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../utils/constants";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  sidebarCollapsed: false,
  bottomPanelCollapsed: false,
  bottomPanelHeight: 220,
  bottomPanelActiveTab: "console",
};

function readStoredSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, JSON.stringify(settings));
    } catch {
      // lightweight preference only — losing it is non-fatal
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(() => ({ settings, updateSetting }), [settings, updateSetting]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
