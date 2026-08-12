import { Spinner } from "./Spinner";
import styles from "./SuspenseFallback.module.css";

export function SuspenseFallback({ label = "Loading" }) {
  return (
    <div className={styles.fallback}>
      <Spinner label={label} />
    </div>
  );
}
