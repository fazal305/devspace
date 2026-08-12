import { useEffect, useMemo, useRef, useState } from "react";
import { useWorker } from "../../hooks/useWorker";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useNotifications } from "../../context/NotificationContext";
import { useProjects } from "../../hooks/useProjects";
import { entryRepository } from "../../db/repositories/entryRepository";
import { getEntryPath } from "../../utils/fileTree";
import { recordPerformanceEntry } from "../../hooks/usePerformanceMonitor";
import { EmptyState } from "../common/EmptyState";
import { Spinner } from "../common/Spinner";
import styles from "./SearchPanel.module.css";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const requestSeq = useRef(0);

  const worker = useWorker(() => new Worker(new URL("../../workers/search.worker.js", import.meta.url), { type: "module" }));
  const { openProject, openFile } = useWorkspace();
  const { notify } = useNotifications();
  const { data: projects } = useProjects();
  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  async function runSearch(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    const seq = ++requestSeq.current;
    setIsSearching(true);
    try {
      const dbStartedAt = performance.now();
      const [entries, files] = await Promise.all([entryRepository.listAll(), entryRepository.listAllFiles()]);
      recordPerformanceEntry("IndexedDB read (search)", performance.now() - dbStartedAt);

      const workerStartedAt = performance.now();
      const matches = await worker.call("search", { query: trimmed, files });
      const workerDuration = performance.now() - workerStartedAt;
      recordPerformanceEntry("Search worker", workerDuration);
      if (seq !== requestSeq.current) return; // a newer search superseded this one

      setAllEntries(entries);
      setResults(matches);
      notify(`Search completed: ${matches.length} match${matches.length === 1 ? "" : "es"} in ${Math.round(workerDuration)}ms`, {
        type: "info",
        duration: 3000,
      });
    } catch {
      notify("Search failed — the search worker may be unavailable.", { type: "error" });
    } finally {
      if (seq === requestSeq.current) setIsSearching(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function openMatch(match) {
    const entry = allEntries.find((e) => e.id === match.entryId);
    if (!entry) return;
    await openProject(match.projectId);
    await openFile(entry);
  }

  const grouped = useMemo(() => {
    if (!results) return [];
    const byEntry = new Map();
    for (const match of results) {
      if (!byEntry.has(match.entryId)) byEntry.set(match.entryId, { ...match, lines: [] });
      byEntry.get(match.entryId).lines.push(match);
    }
    return Array.from(byEntry.values());
  }, [results]);

  return (
    <div className={styles.panel}>
      <div className={styles.searchBox}>
        <input
          className={styles.input}
          type="search"
          placeholder="Search workspace…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search across all projects"
        />
        {isSearching && <Spinner label="Searching" />}
      </div>

      <div className={styles.results}>
        {results === null && (
          <EmptyState title="Search your workspace" description="Find text across every file in every project." />
        )}
        {results !== null && grouped.length === 0 && !isSearching && (
          <EmptyState title="No search results" description="Try a different search term." />
        )}
        {grouped.map((entry) => (
          <div key={entry.entryId} className={styles.fileGroup}>
            <div className={styles.filePath}>
              {projectNameById.get(entry.projectId) ?? "Unknown project"} / {getEntryPath(allEntries, entry.entryId)}
            </div>
            {entry.lines.map((match) => (
              <button
                key={`${match.entryId}-${match.line}`}
                type="button"
                className={styles.matchRow}
                onClick={() => openMatch(match)}
              >
                <span className={styles.lineNumber}>Line {match.line}</span>
                <span className={styles.preview}>{match.preview}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
