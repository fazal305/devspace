import styles from "./SkipLink.module.css";

export function SkipLink({ targetId, children }) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {children}
    </a>
  );
}
