import { Dialog } from "../common/Dialog";
import { useTheme } from "../../context/ThemeContext";
import { THEME_OPTIONS, KEYBOARD_SHORTCUTS } from "../../utils/constants";
import styles from "./SettingsDialog.module.css";

export function SettingsDialog({ open, onClose }) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onClose={onClose} title="Settings" labelledBy="settings-dialog-title">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <div className={styles.themeOptions} role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => (
            <label key={opt.value} className={styles.themeOption}>
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => setTheme(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
        <table className={styles.table}>
          <tbody>
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.combo}>
                <td className={styles.combo}>{shortcut.combo}</td>
                <td className={styles.description}>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Dialog>
  );
}
