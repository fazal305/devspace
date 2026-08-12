import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useRecentFiles } from "../../hooks/useEntries";
import { useSnippets } from "../../hooks/useSnippets";
import { useStorageEstimate } from "../../hooks/useStorageEstimate";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useWorkspace } from "../../context/WorkspaceContext";
import { formatBytes, formatRelativeTime } from "../../utils/formatters";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { ImportProjectButton } from "../projects/ImportProjectButton";
import styles from "./Dashboard.module.css";

export function Dashboard({ onNavigateView }) {
  const { data: projects, error: projectsError } = useProjects();
  const { data: recentFiles } = useRecentFiles(6);
  const { data: snippets } = useSnippets();
  const storage = useStorageEstimate();
  const isOnline = useOnlineStatus();
  const { openProject } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const recentProjects = projects.slice(0, 5);
  const favoriteSnippets = snippets.filter((s) => s.favorite).slice(0, 5);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  if (projectsError) {
    return (
      <div className={styles.dashboard}>
        <EmptyState
          title="Local storage unavailable"
          description="DevSpace couldn't reach IndexedDB in this browser, so the workspace can't load."
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Workspace</h1>
        <p className={styles.subtitle}>Everything here lives in this browser — nothing leaves your machine.</p>
      </div>

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{projects.length}</span>
          <span className={styles.statLabel}>Projects</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{storage.isSupported ? formatBytes(storage.usage) : "—"}</span>
          <span className={styles.statLabel}>{storage.isSupported ? "Storage used" : "Storage — not available in this browser"}</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${isOnline ? styles.online : styles.offline}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className={styles.statLabel}>Connection</span>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          New Project
        </Button>
        <Button variant="secondary" onClick={() => onNavigateView("projects")}>
          Browse Projects
        </Button>
        <ImportProjectButton onNavigateView={onNavigateView} />
        <Button variant="secondary" onClick={() => onNavigateView("snippets")}>
          Browse Snippets
        </Button>
        <Button variant="secondary" onClick={() => onNavigateView("search")}>
          Search Workspace
        </Button>
      </div>

      <div className={styles.columns}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <EmptyState title="No projects yet" description="Create your first project to get started." />
          ) : (
            <ul className={styles.cardList}>
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className={styles.card}
                    onClick={() => {
                      openProject(project.id);
                      onNavigateView("files");
                    }}
                  >
                    <span className={styles.cardTitle}>{project.name}</span>
                    <span className={styles.cardMeta}>Updated {formatRelativeTime(project.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recently Modified Files</h2>
          {recentFiles.length === 0 ? (
            <EmptyState title="No files yet" description="Files you edit will show up here." />
          ) : (
            <ul className={styles.cardList}>
              {recentFiles.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    className={styles.card}
                    onClick={() => {
                      openProject(file.projectId);
                      onNavigateView("files");
                    }}
                  >
                    <span className={styles.cardTitle}>{file.name}</span>
                    <span className={styles.cardMeta}>
                      {projectNameById.get(file.projectId) ?? "Unknown project"} · {formatRelativeTime(file.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Favorite Snippets</h2>
          {favoriteSnippets.length === 0 ? (
            <EmptyState title="No snippets yet" description="Save reusable code snippets here." />
          ) : (
            <ul className={styles.cardList}>
              {favoriteSnippets.map((snippet) => (
                <li key={snippet.id}>
                  <button type="button" className={styles.card} onClick={() => onNavigateView("snippets")}>
                    <span className={styles.cardTitle}>{snippet.title}</span>
                    <span className={styles.cardMeta}>{snippet.language}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CreateProjectDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
