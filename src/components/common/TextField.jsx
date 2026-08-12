import { useId } from "react";
import styles from "./TextField.module.css";

export function TextField({ label, error, className = "", ...props }) {
  const id = useId();
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input id={id} className={styles.input} aria-invalid={!!error} {...props} />
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
