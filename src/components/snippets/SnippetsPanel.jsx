import { useMemo, useState } from "react";
import { useSnippets } from "../../hooks/useSnippets";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useNotifications } from "../../context/NotificationContext";
import { snippetRepository } from "../../db/repositories/snippetRepository";
import { EmptyState } from "../common/EmptyState";
import { Button } from "../common/Button";
import { IconButton } from "../common/IconButton";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { SnippetFormDialog } from "./SnippetFormDialog";
import styles from "./SnippetsPanel.module.css";

export function SnippetsPanel() {
  const { data: snippets, isLoading, error } = useSnippets();
  const { activeTabId, openTabs, updateTabContent } = useWorkspace();
  const { notify } = useNotifications();

  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [editingSnippet, setEditingSnippet] = useState(undefined); // undefined = closed, null = creating, object = editing
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const languages = useMemo(() => Array.from(new Set(snippets.map((s) => s.language))).sort(), [snippets]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snippets.filter((s) => {
      if (languageFilter !== "all" && s.language !== languageFilter) return false;
      if (!needle) return true;
      return (
        s.title.toLowerCase().includes(needle) ||
        s.code.toLowerCase().includes(needle) ||
        s.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [snippets, query, languageFilter]);

  async function handleCopy(snippet) {
    try {
      await navigator.clipboard.writeText(snippet.code);
      notify("Snippet copied to clipboard", { type: "success", duration: 2000 });
    } catch {
      notify("Couldn't access the clipboard in this browser.", { type: "error" });
    }
  }

  function handleInsert(snippet) {
    const activeTab = openTabs.find((tab) => tab.entryId === activeTabId);
    if (!activeTab) {
      notify("Open a file in the editor first.", { type: "warning" });
      return;
    }
    const separator = activeTab.draftContent && !activeTab.draftContent.endsWith("\n") ? "\n" : "";
    updateTabContent(activeTabId, `${activeTab.draftContent}${separator}${snippet.code}`);
    notify("Snippet inserted", { type: "success", duration: 2000 });
  }

  async function handleDelete() {
    await snippetRepository.remove(pendingDeleteId);
    notify("Snippet deleted", { type: "info" });
    setPendingDeleteId(null);
  }

  if (error) {
    return <EmptyState title="Local storage unavailable" description="DevSpace couldn't reach IndexedDB in this browser." />;
  }

  if (!isLoading && snippets.length === 0) {
    return (
      <>
        <EmptyState
          title="No snippets yet"
          description="Save reusable code snippets here."
          action={
            <Button variant="primary" onClick={() => setEditingSnippet(null)}>
              New Snippet
            </Button>
          }
        />
        <SnippetFormDialog open={editingSnippet !== undefined} snippet={editingSnippet} onClose={() => setEditingSnippet(undefined)} />
      </>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search snippets…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search snippets"
        />
        <select className={styles.select} value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} aria-label="Filter by language">
          <option value="all">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <Button variant="primary" onClick={() => setEditingSnippet(null)}>
          + New
        </Button>
      </div>

      <ul className={styles.list}>
        {filtered.length === 0 && <EmptyState title="No search results" description="Try a different search term." />}
        {filtered.map((snippet) => (
          <li key={snippet.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.itemTitle}>{snippet.title}</span>
              <IconButton
                label={snippet.favorite ? "Unfavorite" : "Favorite"}
                active={snippet.favorite}
                onClick={() => snippetRepository.toggleFavorite(snippet.id)}
              >
                {snippet.favorite ? "★" : "☆"}
              </IconButton>
            </div>
            {snippet.description && <p className={styles.itemDescription}>{snippet.description}</p>}
            <div className={styles.meta}>
              <span className={styles.languageBadge}>{snippet.language}</span>
              {snippet.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.itemActions}>
              <IconButton label="Copy" onClick={() => handleCopy(snippet)}>
                ⧉
              </IconButton>
              <IconButton label="Insert into editor" onClick={() => handleInsert(snippet)}>
                ⏎
              </IconButton>
              <IconButton label="Edit" onClick={() => setEditingSnippet(snippet)}>
                ✎
              </IconButton>
              <IconButton label="Delete" onClick={() => setPendingDeleteId(snippet.id)}>
                🗑
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <SnippetFormDialog open={editingSnippet !== undefined} snippet={editingSnippet} onClose={() => setEditingSnippet(undefined)} />
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete snippet?"
        message="This permanently deletes the snippet."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
