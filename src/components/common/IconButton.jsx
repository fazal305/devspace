import styles from "./IconButton.module.css";

export function IconButton({ label, active = false, className = "", children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={`${styles.iconButton} ${active ? styles.active : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}
