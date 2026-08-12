import { EmptyState } from "../common/EmptyState";
import { IconButton } from "../common/IconButton";
import styles from "./ConsoleLog.module.css";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ConsoleLog({ logs, onClear }) {
  if (logs.length === 0) {
    return <EmptyState title="Console is empty" description="Application events will appear here as you work." />;
  }

  return (
    <div className={styles.console}>
      <div className={styles.toolbar}>
        <IconButton label="Clear console" onClick={onClear}>
          ⌫
        </IconButton>
      </div>
      <ul className={styles.list}>
        {logs.map((log) => (
          <li key={log.id} className={`${styles.row} ${styles[log.type] ?? ""}`}>
            <span className={styles.time}>{formatTime(log.timestamp)}</span>
            <span className={styles.message}>{log.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
