import { useEffect, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProjectEntries } from "../../hooks/useEntries";
import { EditorTabs } from "./EditorTabs";
import { EditorPane } from "./EditorPane";
import { ConfirmDialog } from "../common/ConfirmDialog";
import styles from "./EditorArea.module.css";

export function EditorArea() {
  const {
    activeProjectId,
    openTabs,
    activeTabId,
    updateTabContent,
    saveTab,
    closeTab,
    closeAllTabs,
    setActiveTab,
  } = useWorkspace();
  const { data: entries } = useProjectEntries(activeProjectId);

  const [pendingClose, setPendingClose] = useState(null); // 'all' | entryId

  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const tabs = openTabs
    .map((tab) => {
      const entry = entryById.get(tab.entryId);
      return entry ? { ...tab, name: entry.name, language: entry.language } : null;
    })
    .filter(Boolean);
  const activeTab = tabs.find((tab) => tab.entryId === activeTabId);

  // If a file is deleted from the explorer while its tab is open, drop the tab.
  useEffect(() => {
    for (const tab of openTabs) {
      if (!entryById.has(tab.entryId)) closeTab(tab.entryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  function requestClose(entryId) {
    const tab = tabs.find((t) => t.entryId === entryId);
    if (tab?.isDirty) setPendingClose(entryId);
    else closeTab(entryId);
  }

  function requestCloseAll() {
    if (tabs.some((tab) => tab.isDirty)) setPendingClose("all");
    else closeAllTabs();
  }

  function confirmPendingClose() {
    if (pendingClose === "all") closeAllTabs();
    else if (pendingClose) closeTab(pendingClose);
    setPendingClose(null);
  }

  return (
    <div className={styles.area}>
      <EditorTabs tabs={tabs} activeTabId={activeTabId} onSelect={setActiveTab} onClose={requestClose} onCloseAll={requestCloseAll} />
      <div className={styles.paneWrapper}>
        <EditorPane
          key={activeTab?.entryId ?? "empty"}
          entryId={activeTab?.entryId ?? null}
          language={activeTab?.language}
          content={activeTab?.draftContent ?? ""}
          onChange={updateTabContent}
          onSave={saveTab}
        />
      </div>

      <ConfirmDialog
        open={pendingClose !== null}
        title="Discard unsaved changes?"
        message={
          pendingClose === "all"
            ? "One or more open files have unsaved changes. Closing will discard them."
            : "This file has unsaved changes. Closing will discard them."
        }
        confirmLabel="Discard"
        danger
        onConfirm={confirmPendingClose}
        onCancel={() => setPendingClose(null)}
      />
    </div>
  );
}
