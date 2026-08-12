import { SIDEBAR_VIEWS } from "../../utils/constants";
import { ProjectsPanel } from "../projects/ProjectsPanel";
import { FileExplorer } from "../explorer/FileExplorer";
import { SearchPanel } from "../search/SearchPanel";
import { SnippetsPanel } from "../snippets/SnippetsPanel";
import styles from "./Sidebar.module.css";

const VIEW_COMPONENTS = {
  projects: ProjectsPanel,
  files: FileExplorer,
  search: SearchPanel,
  snippets: SnippetsPanel,
};

export function Sidebar({ activeView, onChangeView, isMobileOpen, onCloseMobile }) {
  const activeLabel = SIDEBAR_VIEWS.find((v) => v.id === activeView)?.label ?? "";
  const ViewComponent = VIEW_COMPONENTS[activeView];

  return (
    <>
      {isMobileOpen && <button type="button" className={styles.backdrop} aria-label="Close sidebar" onClick={onCloseMobile} />}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ""}`}>
        <nav className={styles.rail} aria-label="Sidebar views">
          {SIDEBAR_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`${styles.railButton} ${view.id === activeView ? styles.railButtonActive : ""}`}
              aria-pressed={view.id === activeView}
              aria-label={view.label}
              title={view.label}
              onClick={() => onChangeView(view.id)}
            >
              {view.label.charAt(0)}
            </button>
          ))}
        </nav>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>{activeLabel}</div>
          <div className={styles.panelContent}>
            <ViewComponent onNavigateView={onChangeView} />
          </div>
        </div>
      </aside>
    </>
  );
}
