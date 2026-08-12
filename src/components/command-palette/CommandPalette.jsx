import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "../common/Dialog";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { useNotifications } from "../../context/NotificationContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProjectEntries } from "../../hooks/useEntries";
import { useProjectImport } from "../../hooks/useProjectImport";
import { entryRepository } from "../../db/repositories/entryRepository";
import { projectRepository } from "../../db/repositories/projectRepository";
import { exportProjectToZip } from "../../services/exportService";
import { THEME_OPTIONS } from "../../utils/constants";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { SnippetFormDialog } from "../snippets/SnippetFormDialog";
import { buildCommands } from "./commands";
import styles from "./CommandPalette.module.css";

export function CommandPalette({ isOpen, mode, onClose, onNavigateView, onOpenSettings }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateSnippetOpen, setIsCreateSnippetOpen] = useState(false);
  const importInputRef = useRef(null);

  const { theme, setTheme } = useTheme();
  const { updateSetting } = useSettings();
  const { notify, clearLogs } = useNotifications();
  const workspace = useWorkspace();
  const { data: projectEntries } = useProjectEntries(workspace.activeProjectId);
  const { importFromFile } = useProjectImport(onNavigateView);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen, mode]);

  function cycleTheme() {
    const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.value === theme);
    setTheme(THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length].value);
  }

  async function exportActiveProject() {
    const project = await projectRepository.get(workspace.activeProjectId);
    if (!project) return;
    try {
      const entries = await entryRepository.listByProject(project.id);
      await exportProjectToZip(project, entries);
      notify(`Exported "${project.name}"`, { type: "success" });
    } catch {
      notify("Couldn't export that project.", { type: "error" });
    }
  }

  const commands = useMemo(
    () =>
      buildCommands({
        openTabs: workspace.openTabs,
        activeTabId: workspace.activeTabId,
        activeProjectId: workspace.activeProjectId,
        saveTab: workspace.saveTab,
        closeAllTabs: workspace.closeAllTabs,
        onNavigateView,
        cycleTheme,
        updateSetting,
        clearLogs,
        openCreateProjectDialog: () => setIsCreateProjectOpen(true),
        openImportPicker: () => importInputRef.current?.click(),
        exportActiveProject,
        openCreateSnippetDialog: () => {
          onNavigateView("snippets");
          setIsCreateSnippetOpen(true);
        },
        openSettingsDialog: onOpenSettings,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace.openTabs, workspace.activeTabId, workspace.activeProjectId, theme]
  );

  const filteredCommands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(needle) || c.group.toLowerCase().includes(needle));
  }, [commands, query]);

  const files = mode === "quickopen" ? projectEntries.filter((e) => e.type === "file") : [];
  const filteredFiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return files;
    return files.filter((f) => f.name.toLowerCase().includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, query]);

  const items = mode === "quickopen" ? filteredFiles : filteredCommands;

  function runItem(index) {
    const item = items[index];
    if (!item) return;
    if (mode === "quickopen") workspace.openFile(item);
    else item.run?.();
    onClose();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runItem(selectedIndex);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} labelledBy="command-palette-title">
        <div className={styles.palette}>
          <span id="command-palette-title" className={styles.srOnly}>
            {mode === "quickopen" ? "Quick open a file" : "Command palette"}
          </span>
          <input
            autoFocus
            className={styles.input}
            placeholder={mode === "quickopen" ? "Go to file…" : "Type a command…"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <ul className={styles.list} role="listbox">
            {items.length === 0 && <li className={styles.empty}>No matches</li>}
            {items.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === selectedIndex}>
                <button
                  type="button"
                  className={`${styles.item} ${index === selectedIndex ? styles.itemActive : ""}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runItem(index)}
                >
                  {mode === "quickopen" ? (
                    <span className={styles.itemLabel}>{item.name}</span>
                  ) : (
                    <>
                      <span className={styles.itemLabel}>{item.label}</span>
                      <span className={styles.itemGroup}>{item.group}</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Dialog>

      <input
        ref={importInputRef}
        type="file"
        accept=".zip"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          importFromFile(file);
        }}
      />
      <CreateProjectDialog open={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} />
      <SnippetFormDialog open={isCreateSnippetOpen} snippet={null} onClose={() => setIsCreateSnippetOpen(false)} />
    </>
  );
}
