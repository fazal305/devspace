import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useNotifications } from "../../context/NotificationContext";
import { projectRepository } from "../../db/repositories/projectRepository";
import { entryRepository } from "../../db/repositories/entryRepository";
import { validateProjectName } from "../../utils/validators";
import { formatRelativeTime } from "../../utils/formatters";
import { buildTree } from "../../utils/fileTree";
import { isFileSystemAccessSupported, pickAndReadDirectory, pickAndWriteProject } from "../../services/fileSystemService";
import { exportProjectToZip } from "../../services/exportService";
import { useWebNotification } from "../../hooks/useWebNotification";
import { EmptyState } from "../common/EmptyState";
import { IconButton } from "../common/IconButton";
import { Button } from "../common/Button";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { ImportProjectButton } from "./ImportProjectButton";
import styles from "./ProjectsPanel.module.css";

const FS_ACCESS_UNAVAILABLE_TITLE = "The File System Access API isn't supported in this browser.";

export function ProjectsPanel({ onNavigateView }) {
  const { data: projects, isLoading, error } = useProjects();
  const { activeProjectId, openProject, deleteProject } = useWorkspace();
  const { notify } = useNotifications();
  const { notifyIfHidden } = useWebNotification();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  function startRename(project) {
    setRenamingId(project.id);
    setRenameValue(project.name);
  }

  async function commitRename(id) {
    const validationError = validateProjectName(renameValue);
    if (!validationError && renameValue.trim() !== "") {
      await projectRepository.rename(id, renameValue.trim());
    }
    setRenamingId(null);
  }

  async function handleDuplicate(id) {
    await projectRepository.duplicate(id);
    notify("Project duplicated", { type: "success" });
  }

  async function handleDelete() {
    await deleteProject(pendingDeleteId);
    notify("Project deleted", { type: "info" });
    setPendingDeleteId(null);
  }

  async function handleOpenLocalFolder() {
    try {
      const { name, files } = await pickAndReadDirectory();
      const project = await projectRepository.create({ name });
      await entryRepository.seedFromTemplate(project.id, files);
      notify(`Imported "${name}" (${files.length} file${files.length === 1 ? "" : "s"})`, { type: "success" });
      notifyIfHidden("DevSpace", { body: `Imported "${name}" from your local folder.` });
      await openProject(project.id);
      onNavigateView?.("files");
    } catch (err) {
      if (err.name === "AbortError") return;
      notify(err.message ?? "Couldn't open that folder.", { type: "error" });
    }
  }

  async function handleSaveToFolder(project) {
    try {
      const entries = await entryRepository.listByProject(project.id);
      const tree = buildTree(entries);
      await pickAndWriteProject(tree);
      notify(`Saved "${project.name}" to your local folder`, { type: "success" });
      notifyIfHidden("DevSpace", { body: `Saved "${project.name}" to your local folder.` });
    } catch (err) {
      if (err.name === "AbortError") return;
      notify(err.message ?? "Couldn't save to that folder.", { type: "error" });
    }
  }

  async function handleExport(project) {
    try {
      const entries = await entryRepository.listByProject(project.id);
      await exportProjectToZip(project, entries);
      notify(`Exported "${project.name}"`, { type: "success" });
    } catch {
      notify("Couldn't export that project.", { type: "error" });
    }
  }

  if (error) {
    return <EmptyState title="Local storage unavailable" description="DevSpace couldn't reach IndexedDB in this browser." />;
  }

  if (!isLoading && projects.length === 0) {
    return (
      <>
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                New Project
              </Button>
              <Button
                variant="secondary"
                disabled={!isFileSystemAccessSupported}
                title={isFileSystemAccessSupported ? undefined : FS_ACCESS_UNAVAILABLE_TITLE}
                onClick={handleOpenLocalFolder}
              >
                Open Local Folder
              </Button>
              <ImportProjectButton onNavigateView={onNavigateView} />
            </div>
          }
        />
        <CreateProjectDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.newButton} onClick={() => setIsCreateOpen(true)}>
          + New Project
        </button>
        <button
          type="button"
          className={styles.newButton}
          disabled={!isFileSystemAccessSupported}
          title={isFileSystemAccessSupported ? undefined : FS_ACCESS_UNAVAILABLE_TITLE}
          onClick={handleOpenLocalFolder}
        >
          Open Local Folder
        </button>
        <ImportProjectButton variant="secondary" label="Import from Zip" onNavigateView={onNavigateView} />
      </div>
      <ul className={styles.list}>
        {projects.map((project) => (
          <li key={project.id} className={`${styles.item} ${project.id === activeProjectId ? styles.itemActive : ""}`}>
            {renamingId === project.id ? (
              <input
                autoFocus
                className={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(project.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(project.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => {
                  openProject(project.id);
                  onNavigateView?.("files");
                }}
              >
                <span className={styles.itemName}>{project.name}</span>
                <span className={styles.itemMeta}>Updated {formatRelativeTime(project.updatedAt)}</span>
              </button>
            )}

            <div className={styles.itemActions}>
              <IconButton
                label={project.favorite ? "Unfavorite" : "Favorite"}
                active={project.favorite}
                onClick={() => projectRepository.toggleFavorite(project.id)}
              >
                {project.favorite ? "★" : "☆"}
              </IconButton>
              <IconButton label="Rename" onClick={() => startRename(project)}>
                ✎
              </IconButton>
              <IconButton label="Duplicate" onClick={() => handleDuplicate(project.id)}>
                ⧉
              </IconButton>
              <IconButton
                label="Save to local folder"
                disabled={!isFileSystemAccessSupported}
                onClick={() => handleSaveToFolder(project)}
              >
                💾
              </IconButton>
              <IconButton label="Export as zip" onClick={() => handleExport(project)}>
                ⬇
              </IconButton>
              <IconButton label="Delete" onClick={() => setPendingDeleteId(project.id)}>
                🗑
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <CreateProjectDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete project?"
        message="This permanently deletes the project and all of its files from this browser."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
