// Central command registry. Each command is data (id/label/group/run) so the
// palette, and eventually keyboard shortcuts, both read from one source
// instead of hardcoding actions in UI components.
export function buildCommands(ctx) {
  const activeTab = ctx.openTabs.find((tab) => tab.entryId === ctx.activeTabId);

  const commands = [
    { id: "new-project", label: "New Project", group: "Projects", run: ctx.openCreateProjectDialog },
    { id: "import-project", label: "Import Project", group: "Projects", run: ctx.openImportPicker },
    { id: "browse-projects", label: "Browse Projects", group: "Navigate", run: () => ctx.onNavigateView("projects") },
    { id: "browse-files", label: "Browse Files", group: "Navigate", run: () => ctx.onNavigateView("files") },
    { id: "search-workspace", label: "Search Workspace", group: "Navigate", run: () => ctx.onNavigateView("search") },
    { id: "browse-snippets", label: "Open Snippets", group: "Navigate", run: () => ctx.onNavigateView("snippets") },
    { id: "new-snippet", label: "New Snippet", group: "Snippets", run: ctx.openCreateSnippetDialog },
    { id: "toggle-theme", label: "Toggle Theme", group: "Preferences", run: ctx.cycleTheme },
    { id: "open-settings", label: "Open Settings", group: "Preferences", run: ctx.openSettingsDialog },
    {
      id: "show-performance",
      label: "Show Performance",
      group: "Panels",
      run: () => {
        ctx.updateSetting("bottomPanelActiveTab", "performance");
        ctx.updateSetting("bottomPanelCollapsed", false);
      },
    },
    { id: "clear-console", label: "Clear Console", group: "Panels", run: ctx.clearLogs },
  ];

  if (activeTab?.isDirty) {
    commands.push({
      id: "save-file",
      label: "Save File",
      group: "Editor",
      run: () => ctx.saveTab(activeTab.entryId, activeTab.draftContent),
    });
  }

  if (ctx.openTabs.length > 0) {
    commands.push({ id: "close-all-tabs", label: "Close All Tabs", group: "Editor", run: ctx.closeAllTabs });
  }

  if (ctx.activeProjectId) {
    commands.push({ id: "export-project", label: "Export Active Project", group: "Projects", run: ctx.exportActiveProject });
  }

  return commands;
}
