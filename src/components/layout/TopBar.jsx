import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useTheme } from "../../context/ThemeContext";
import { THEME_OPTIONS } from "../../utils/constants";
import { IconButton } from "../common/IconButton";
import styles from "./TopBar.module.css";

export function TopBar({ onOpenCommandPalette, onOpenSettings, onToggleSidebar }) {
  const isOnline = useOnlineStatus();
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.value === theme);
    const next = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length];
    setTheme(next.value);
  }

  return (
    <header className={styles.topBar}>
      <IconButton label="Toggle sidebar" className={styles.menuToggle} onClick={onToggleSidebar}>
        ☰
      </IconButton>

      <div className={styles.brand}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.mark}>
          <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--color-primary)" />
          <path d="M8 8L4.5 12L8 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M16 8L19.5 12L16 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="16.5" r="1.1" fill="#fff" />
        </svg>
        <span className={styles.name}>DevSpace</span>
      </div>

      <button type="button" className={styles.paletteTrigger} onClick={() => onOpenCommandPalette("command")}>
        <span aria-hidden="true">⌕</span>
        <span className={styles.paletteLabel}>Type a command or search…</span>
        <span className={styles.paletteShortcut}>Ctrl K</span>
      </button>

      <div className={styles.spacer} />

      <div className={styles.status} role="status">
        <span className={`${styles.dot} ${isOnline ? styles.online : styles.offline}`} aria-hidden="true" />
        <span className={styles.statusLabel}>{isOnline ? "Online" : "Offline"}</span>
      </div>

      <IconButton label={`Theme: ${theme}. Click to cycle.`} onClick={cycleTheme}>
        {theme === "dark" ? "🌙" : theme === "light" ? "☀" : "🖥"}
      </IconButton>
      <IconButton label="Settings" onClick={onOpenSettings}>
        ⚙
      </IconButton>
    </header>
  );
}
