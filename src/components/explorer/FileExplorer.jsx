import { useMemo, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProjectEntries } from "../../hooks/useEntries";
import { useNotifications } from "../../context/NotificationContext";
import { entryRepository } from "../../db/repositories/entryRepository";
import { buildTree, getDescendantIds } from "../../utils/fileTree";
import { validateEntryName } from "../../utils/validators";
import { detectLanguage } from "../../utils/languageConfig";
import { EmptyState } from "../common/EmptyState";
import { IconButton } from "../common/IconButton";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EntryRow } from "./EntryRow";
import styles from "./FileExplorer.module.css";

export function FileExplorer() {
  const { activeProjectId, openTabs, activeTabId, openFile } = useWorkspace();
  const { data: entries, isLoading, error } = useProjectEntries(activeProjectId);
  const { notify } = useNotifications();

  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [creatingIn, setCreatingIn] = useState(null);
  const [creatingValue, setCreatingValue] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const tree = useMemo(() => buildTree(entries), [entries]);
  const dirtyEntryIds = useMemo(
    () => new Set(openTabs.filter((tab) => tab.isDirty).map((tab) => tab.entryId)),
    [openTabs]
  );

  if (!activeProjectId) {
    return <EmptyState title="No project open" description="Open or create a project to see its files here." />;
  }

  if (error) {
    return <EmptyState title="Local storage unavailable" description="DevSpace couldn't reach IndexedDB in this browser." />;
  }

  function startCreate(parentId, type) {
    setExpandedIds((prev) => (parentId ? new Set(prev).add(parentId) : prev));
    setCreatingIn({ parentId, type });
    setCreatingValue("");
  }

  async function commitCreate() {
    if (!creatingIn) return;
    const name = creatingValue.trim();
    const validationError = validateEntryName(name);
    if (validationError) {
      setCreatingIn(null);
      return;
    }
    await entryRepository.create({
      projectId: activeProjectId,
      parentId: creatingIn.parentId,
      name,
      type: creatingIn.type,
      language: creatingIn.type === "file" ? detectLanguage(name) : null,
    });
    setCreatingIn(null);
  }

  async function commitRename(id) {
    const name = renameValue.trim();
    const validationError = validateEntryName(name);
    if (!validationError) await entryRepository.rename(id, name);
    setRenamingId(null);
  }

  async function handleDelete() {
    await entryRepository.remove(pendingDelete.id);
    notify(`${pendingDelete.type === "folder" ? "Folder" : "File"} deleted`, { type: "info" });
    setPendingDelete(null);
  }

  async function handleDrop(targetId) {
    setDropTargetId(null);
    const sourceId = draggedId;
    setDraggedId(null);
    if (!sourceId || sourceId === targetId) return;
    try {
      await entryRepository.move(sourceId, targetId);
    } catch (err) {
      notify(err.message ?? "Couldn't move item.", { type: "error" });
    }
  }

  const descendantCount = pendingDelete?.type === "folder" ? getDescendantIds(entries, pendingDelete.id).length : 0;

  const actions = {
    onToggle: (id) =>
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    onOpenFile: (node) => openFile(node),
    onStartRename: (node) => {
      setRenamingId(node.id);
      setRenameValue(node.name);
    },
    onRenameChange: setRenameValue,
    onCommitRename: commitRename,
    onCancelRename: () => setRenamingId(null),
    onCreateChild: startCreate,
    onCreatingChange: setCreatingValue,
    onCommitCreate: commitCreate,
    onCancelCreate: () => setCreatingIn(null),
    onDuplicate: async (id) => {
      await entryRepository.duplicate(id);
      notify("Duplicated", { type: "success" });
    },
    onDelete: (node) => setPendingDelete(node),
    onDragStart: setDraggedId,
    onDragOver: setDropTargetId,
    onDrop: handleDrop,
  };

  const ui = { expandedIds, renamingId, renameValue, creatingIn, creatingValue, dirtyEntryIds, activeTabId, dropTargetId };

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <IconButton label="New file at root" onClick={() => startCreate(null, "file")}>
          +📄
        </IconButton>
        <IconButton label="New folder at root" onClick={() => startCreate(null, "folder")}>
          +📁
        </IconButton>
      </div>

      <div
        className={styles.treeArea}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTargetId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) handleDrop(null);
        }}
      >
        {!isLoading && tree.length === 0 && !creatingIn && (
          <EmptyState title="Empty project" description="Create a file or folder to get started." />
        )}
        <ul className={styles.root}>
          {creatingIn?.parentId === null && (
            <li>
              <div className={styles.rootCreateRow}>
                <span className={styles.icon} aria-hidden="true">
                  {creatingIn.type === "folder" ? "📁" : "📄"}
                </span>
                <input
                  autoFocus
                  className={styles.renameInput}
                  value={creatingValue}
                  placeholder={creatingIn.type === "folder" ? "folder-name" : "file-name.js"}
                  onChange={(e) => setCreatingValue(e.target.value)}
                  onBlur={commitCreate}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitCreate();
                    if (e.key === "Escape") setCreatingIn(null);
                  }}
                />
              </div>
            </li>
          )}
          {tree.map((node) => (
            <EntryRow key={node.id} node={node} depth={0} actions={actions} ui={ui} />
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.type === "folder" ? "folder" : "file"}?`}
        message={
          descendantCount > 0
            ? `"${pendingDelete?.name}" and ${descendantCount} item${descendantCount === 1 ? "" : "s"} inside it will be permanently deleted.`
            : `"${pendingDelete?.name}" will be permanently deleted.`
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
