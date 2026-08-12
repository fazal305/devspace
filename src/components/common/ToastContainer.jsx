import { useNotifications } from "../../context/NotificationContext";
import styles from "./ToastContainer.module.css";

const ICON_BY_TYPE = {
  info: "ℹ",
  success: "✓",
  error: "✕",
  warning: "!",
};

export function ToastContainer() {
  const { notifications, dismiss } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container} role="region" aria-label="Notifications">
      {notifications.map((n) => (
        <div key={n.id} className={`${styles.toast} ${styles[n.type] ?? ""}`} role="status">
          <span className={styles.icon} aria-hidden="true">
            {ICON_BY_TYPE[n.type] ?? ICON_BY_TYPE.info}
          </span>
          <span className={styles.message}>{n.message}</span>
          <button type="button" className={styles.dismiss} aria-label="Dismiss notification" onClick={() => dismiss(n.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
