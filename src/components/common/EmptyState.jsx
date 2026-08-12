import styles from "./EmptyState.module.css";

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className={styles.emptyState}>
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
