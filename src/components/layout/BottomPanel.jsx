import { BOTTOM_PANEL_TABS } from "../../utils/constants";
import { useSettings } from "../../context/SettingsContext";
import { useNotifications } from "../../context/NotificationContext";
import { IconButton } from "../common/IconButton";
import { EmptyState } from "../common/EmptyState";
import { ConsoleLog } from "../console/ConsoleLog";
import { PerformancePanel } from "../performance/PerformancePanel";
import styles from "./BottomPanel.module.css";

const TAB_EMPTY_STATE = {
  output: { title: "No output yet", description: "Results from background operations will appear here." },
  problems: { title: "No problems detected", description: "Issues found in your files will be listed here." },
};

export function BottomPanel() {
  const { settings, updateSetting } = useSettings();
  const { logs, clearLogs } = useNotifications();
  const activeTab = settings.bottomPanelActiveTab;
  const collapsed = settings.bottomPanelCollapsed;
  const empty = TAB_EMPTY_STATE[activeTab];

  return (
    <section className={styles.bottomPanel} aria-label="Bottom panel">
      <div className={styles.tabBar}>
        <div className={styles.tabs} role="tablist" aria-label="Bottom panel tabs">
          {BOTTOM_PANEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              className={`${styles.tab} ${tab.id === activeTab && !collapsed ? styles.tabActive : ""}`}
              onClick={() => {
                updateSetting("bottomPanelActiveTab", tab.id);
                if (collapsed) updateSetting("bottomPanelCollapsed", false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <IconButton
          label={collapsed ? "Expand panel" : "Collapse panel"}
          onClick={() => updateSetting("bottomPanelCollapsed", !collapsed)}
        >
          {collapsed ? "▲" : "▼"}
        </IconButton>
      </div>
      {!collapsed && (
        <div className={styles.content} role="tabpanel">
          {activeTab === "console" && <ConsoleLog logs={logs} onClear={clearLogs} />}
          {activeTab === "performance" && <PerformancePanel />}
          {(activeTab === "output" || activeTab === "problems") && empty && (
            <EmptyState title={empty.title} description={empty.description} />
          )}
        </div>
      )}
    </section>
  );
}
