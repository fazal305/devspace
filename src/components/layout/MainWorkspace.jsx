import { Suspense, lazy } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Dashboard } from "../dashboard/Dashboard";
import { SuspenseFallback } from "../common/SuspenseFallback";
import styles from "./MainWorkspace.module.css";

// CodeMirror + its language packages are the single heaviest dependency in
// the app — deferring them until a project is actually open keeps the
// initial bundle (and first paint) lean for the common "browsing" case.
const EditorArea = lazy(() => import("../editor/EditorArea").then((m) => ({ default: m.EditorArea })));

export function MainWorkspace({ onNavigateView }) {
  const { activeProjectId } = useWorkspace();

  return (
    <div id="main-content" className={styles.workspace} tabIndex={-1}>
      {activeProjectId ? (
        <Suspense fallback={<SuspenseFallback label="Loading editor" />}>
          <EditorArea />
        </Suspense>
      ) : (
        <Dashboard onNavigateView={onNavigateView} />
      )}
    </div>
  );
}
