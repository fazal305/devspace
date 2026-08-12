// Centralized configuration for anything that drives dynamic UI
// (nav items, option lists, storage keys). Plain text labels that
// only ever appear in one place stay inline in their component.

export const STORAGE_KEYS = {
  THEME: "devspace:theme",
  UI_SETTINGS: "devspace:ui-settings",
};

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const SIDEBAR_VIEWS = [
  { id: "projects", label: "Projects" },
  { id: "files", label: "Files" },
  { id: "search", label: "Search" },
  { id: "snippets", label: "Snippets" },
];

export const BOTTOM_PANEL_TABS = [
  { id: "console", label: "Console" },
  { id: "output", label: "Output" },
  { id: "problems", label: "Problems" },
  { id: "performance", label: "Performance" },
];

export const NOTIFICATION_DEFAULT_DURATION_MS = 4000;
export const MAX_CONSOLE_LOG_ENTRIES = 200;

export const KEYBOARD_SHORTCUTS = [
  { combo: "Ctrl/Cmd + K", description: "Open command palette" },
  { combo: "Ctrl/Cmd + P", description: "Quick open a file" },
  { combo: "Ctrl/Cmd + Shift + F", description: "Search workspace" },
  { combo: "Ctrl/Cmd + S", description: "Save the active file" },
  { combo: "Ctrl/Cmd + N", description: "New file in the active project" },
  { combo: "Escape", description: "Close dialogs and palettes" },
];
