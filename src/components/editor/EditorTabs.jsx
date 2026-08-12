import { IconButton } from "../common/IconButton";
import styles from "./EditorTabs.module.css";

export function EditorTabs({ tabs, activeTabId, onSelect, onClose, onCloseAll }) {
  if (tabs.length === 0) return null;

  return (
    <div className={styles.tabBar} role="tablist" aria-label="Open files">
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <div
            key={tab.entryId}
            role="tab"
            aria-selected={tab.entryId === activeTabId}
            className={`${styles.tab} ${tab.entryId === activeTabId ? styles.tabActive : ""}`}
          >
            <button type="button" className={styles.tabLabel} onClick={() => onSelect(tab.entryId)}>
              <span className={styles.tabName}>{tab.name}</span>
              {tab.isDirty && <span className={styles.dirtyDot} aria-label="Unsaved changes" />}
            </button>
            <button
              type="button"
              className={styles.tabClose}
              aria-label={`Close ${tab.name}`}
              onClick={() => onClose(tab.entryId)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <IconButton label="Close all tabs" onClick={onCloseAll}>
        ⨯⨯
      </IconButton>
    </div>
  );
}
