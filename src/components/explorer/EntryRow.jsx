import { IconButton } from "../common/IconButton";
import styles from "./EntryRow.module.css";

const FOLDER_ICON = { collapsed: "▸", expanded: "▾" };

export function EntryRow({ node, depth, actions, ui }) {
  const isFolder = node.type === "folder";
  const isExpanded = ui.expandedIds.has(node.id);
  const isRenaming = ui.renamingId === node.id;
  const isActive = ui.activeTabId === node.id;
  const isDirty = ui.dirtyEntryIds.has(node.id);
  const isDropTarget = isFolder && ui.dropTargetId === node.id;

  return (
    <li>
      <div
        className={`${styles.row} ${isActive ? styles.rowActive : ""} ${isDropTarget ? styles.rowDropTarget : ""}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        draggable={!isRenaming}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          actions.onDragStart(node.id);
        }}
        onDragOver={(e) => {
          if (!isFolder) return;
          e.preventDefault();
          actions.onDragOver(node.id);
        }}
        onDragLeave={() => actions.onDragOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          actions.onDrop(node.id);
        }}
      >
        <button
          type="button"
          className={styles.disclosure}
          aria-hidden={!isFolder}
          tabIndex={-1}
          onClick={() => isFolder && actions.onToggle(node.id)}
        >
          {isFolder ? (isExpanded ? FOLDER_ICON.expanded : FOLDER_ICON.collapsed) : ""}
        </button>

        {isRenaming ? (
          <input
            autoFocus
            className={styles.renameInput}
            value={ui.renameValue}
            onChange={(e) => actions.onRenameChange(e.target.value)}
            onBlur={() => actions.onCommitRename(node.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") actions.onCommitRename(node.id);
              if (e.key === "Escape") actions.onCancelRename();
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.name}
            onClick={() => (isFolder ? actions.onToggle(node.id) : actions.onOpenFile(node))}
          >
            <span className={styles.icon} aria-hidden="true">
              {isFolder ? "📁" : "📄"}
            </span>
            <span className={styles.label}>{node.name}</span>
            {isDirty && <span className={styles.dirtyDot} aria-label="Unsaved changes" />}
          </button>
        )}

        <div className={styles.actions}>
          {isFolder && (
            <>
              <IconButton label="New file" onClick={() => actions.onCreateChild(node.id, "file")}>
                +📄
              </IconButton>
              <IconButton label="New folder" onClick={() => actions.onCreateChild(node.id, "folder")}>
                +📁
              </IconButton>
            </>
          )}
          <IconButton label="Rename" onClick={() => actions.onStartRename(node)}>
            ✎
          </IconButton>
          <IconButton label="Duplicate" onClick={() => actions.onDuplicate(node.id)}>
            ⧉
          </IconButton>
          <IconButton label="Delete" onClick={() => actions.onDelete(node)}>
            🗑
          </IconButton>
        </div>
      </div>

      {isFolder && isExpanded && (
        <ul className={styles.children}>
          {ui.creatingIn?.parentId === node.id && (
            <li>
              <div className={styles.row} style={{ paddingLeft: `${(depth + 1) * 14 + 6}px` }}>
                <span className={styles.disclosure} />
                <span className={styles.icon} aria-hidden="true">
                  {ui.creatingIn.type === "folder" ? "📁" : "📄"}
                </span>
                <input
                  autoFocus
                  className={styles.renameInput}
                  value={ui.creatingValue}
                  placeholder={ui.creatingIn.type === "folder" ? "folder-name" : "file-name.js"}
                  onChange={(e) => actions.onCreatingChange(e.target.value)}
                  onBlur={() => actions.onCommitCreate()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") actions.onCommitCreate();
                    if (e.key === "Escape") actions.onCancelCreate();
                  }}
                />
              </div>
            </li>
          )}
          {node.children.map((child) => (
            <EntryRow key={child.id} node={child} depth={depth + 1} actions={actions} ui={ui} />
          ))}
        </ul>
      )}
    </li>
  );
}
