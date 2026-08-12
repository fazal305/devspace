import { useEffect, useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MainWorkspace } from "./MainWorkspace";
import { BottomPanel } from "./BottomPanel";
import { CommandPalette } from "../command-palette/CommandPalette";
import { SettingsDialog } from "../settings/SettingsDialog";
import { SkipLink } from "../common/SkipLink";
import { useCommandPalette } from "../../hooks/useCommandPalette";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useNotifications } from "../../context/NotificationContext";
import { entryRepository } from "../../db/repositories/entryRepository";
import styles from "./AppShell.module.css";

export function AppShell() {
  const [activeView, setActiveViewRaw] = useState("projects");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const palette = useCommandPalette();
  const workspace = useWorkspace();
  const { notify } = useNotifications();

  // Picking a view (or opening a project, which routes through the same
  // callback) should also dismiss the mobile drawer — otherwise the sidebar
  // stays open covering the very content the user just chose to view.
  function setActiveView(view) {
    setActiveViewRaw(view);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    function handleUpdateAvailable() {
      notify("A new version of DevSpace is available. Reload to update.", { type: "info", duration: 0 });
    }
    window.addEventListener("devspace:sw-update", handleUpdateAvailable);
    return () => window.removeEventListener("devspace:sw-update", handleUpdateAvailable);
  }, [notify]);

  useKeyboardShortcuts({
    "mod+k": () => palette.open("command"),
    "mod+p": () => {
      if (workspace.activeProjectId) palette.open("quickopen");
    },
    "mod+shift+f": () => setActiveView("search"),
    "mod+s": () => {
      if (document.activeElement?.closest(".cm-editor")) return false; // the editor's own keymap already handled it
      const activeTab = workspace.openTabs.find((tab) => tab.entryId === workspace.activeTabId);
      if (activeTab?.isDirty) workspace.saveTab(activeTab.entryId, activeTab.draftContent);
    },
    "mod+n": async () => {
      if (!workspace.activeProjectId) return;
      setActiveView("files");
      const entry = await entryRepository.create({
        projectId: workspace.activeProjectId,
        parentId: null,
        name: "untitled.txt",
        type: "file",
        language: "plaintext",
      });
      notify("File created", { type: "success", duration: 2000 });
      workspace.openFile(entry);
    },
  });

  return (
    <div className={styles.shell}>
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <TopBar
        onOpenCommandPalette={palette.open}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen((open) => !open)}
      />
      <div className={styles.body}>
        <Sidebar
          activeView={activeView}
          onChangeView={setActiveView}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <div className={styles.mainColumn}>
          <MainWorkspace onNavigateView={setActiveView} />
          <BottomPanel />
        </div>
      </div>

      <CommandPalette
        isOpen={palette.isOpen}
        mode={palette.mode}
        onClose={palette.close}
        onNavigateView={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <SettingsDialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
