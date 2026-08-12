import { useCallback, useState } from "react";
import { importProjectFromZip } from "../services/importService";
import { useNotifications } from "../context/NotificationContext";
import { useWorkspace } from "../context/WorkspaceContext";

function describeImportError(err) {
  if (err?.name === "QuotaExceededError") {
    return "Storage quota exceeded — free up space by deleting a project, then try again.";
  }
  return err?.message || "Import failed.";
}

// Shared by ImportProjectButton and the command palette so the parse →
// create → open → report flow (and its error handling) lives in one place.
export function useProjectImport(onNavigateView) {
  const [isImporting, setIsImporting] = useState(false);
  const { notify } = useNotifications();
  const { openProject } = useWorkspace();

  const importFromFile = useCallback(
    async (file) => {
      if (!file) return;
      setIsImporting(true);
      try {
        const { project, stats } = await importProjectFromZip(file);
        const warningCount = stats.warnings.length;
        notify(
          `Import complete — ${stats.filesImported} file${stats.filesImported === 1 ? "" : "s"}, ${stats.foldersImported} folder${stats.foldersImported === 1 ? "" : "s"}, ${stats.skipped} skipped${warningCount ? `, ${warningCount} warning${warningCount === 1 ? "" : "s"}` : ""}`,
          { type: warningCount ? "warning" : "success", duration: 5000 }
        );
        await openProject(project.id);
        onNavigateView?.("files");
      } catch (err) {
        notify(describeImportError(err), { type: "error" });
      } finally {
        setIsImporting(false);
      }
    },
    [notify, openProject, onNavigateView]
  );

  return { isImporting, importFromFile };
}
