import { useEffect, useRef, useState } from "react";
import { usePerformanceEntries } from "../../hooks/usePerformanceMonitor";
import { formatBytes } from "../../utils/formatters";
import styles from "./PerformancePanel.module.css";

const NOT_AVAILABLE = "Not available in this browser";

function useLiveFps() {
  const [fps, setFps] = useState(null);

  useEffect(() => {
    let frameCount = 0;
    let lastSampleAt = performance.now();
    let rafId;

    function tick(now) {
      frameCount += 1;
      const elapsed = now - lastSampleAt;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastSampleAt = now;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

function useLoadTime() {
  const loadTimeRef = useRef(undefined);
  if (loadTimeRef.current === undefined) {
    const [navEntry] = performance.getEntriesByType("navigation");
    loadTimeRef.current = navEntry ? Math.round(navEntry.loadEventEnd) : null;
  }
  return loadTimeRef.current;
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

export function PerformancePanel() {
  const fps = useLiveFps();
  const loadTime = useLoadTime();
  const recentEntries = usePerformanceEntries();
  const memory = "memory" in performance ? performance.memory : null;

  return (
    <div className={styles.panel}>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>FPS</span>
          <span className={styles.metricValue}>{fps === null ? "Measuring…" : fps}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Page load time</span>
          <span className={styles.metricValue}>{loadTime === null ? NOT_AVAILABLE : formatMs(loadTime)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Memory used</span>
          <span className={styles.metricValue}>{memory ? formatBytes(memory.usedJSHeapSize) : NOT_AVAILABLE}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Memory limit</span>
          <span className={styles.metricValue}>{memory ? formatBytes(memory.jsHeapSizeLimit) : NOT_AVAILABLE}</span>
        </div>
      </div>

      <div className={styles.log}>
        <div className={styles.logHeader}>Recorded operations</div>
        {recentEntries.length === 0 ? (
          <p className={styles.empty}>Worker and IndexedDB timings will appear here as you search, save, and import.</p>
        ) : (
          <ul className={styles.list}>
            {recentEntries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <span className={styles.rowLabel}>{entry.label}</span>
                <span className={styles.rowValue}>{formatMs(entry.durationMs)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
