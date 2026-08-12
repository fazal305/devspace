import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { workspaceReducer, initialWorkspaceState } from "../reducers/workspaceReducer";
import { entryRepository } from "../db/repositories/entryRepository";
import { projectRepository } from "../db/repositories/projectRepository";
import { recentItemsRepository } from "../db/repositories/recentItemsRepository";
import { publish, subscribe } from "../services/broadcastService";
import { recordPerformanceEntry } from "../hooks/usePerformanceMonitor";
import { useNotifications } from "./NotificationContext";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);
  const { notify } = useNotifications();
  const activeProjectIdRef = useRef(state.activeProjectId);
  activeProjectIdRef.current = state.activeProjectId;

  const openProject = useCallback(
    async (projectId) => {
      dispatch({ type: "OPEN_PROJECT", projectId });
      await recentItemsRepository.trackProject(projectId);
      await projectRepository.touch(projectId);
    },
    []
  );

  const closeProject = useCallback(() => dispatch({ type: "CLOSE_PROJECT" }), []);

  // Deletion goes through here (rather than components calling
  // projectRepository.remove directly) so every tab agrees on what happens
  // when the project currently open in THIS tab gets deleted from another one.
  const deleteProject = useCallback(
    async (projectId) => {
      await projectRepository.remove(projectId);
      publish({ type: "project-deleted", projectId });
      if (activeProjectIdRef.current === projectId) dispatch({ type: "CLOSE_PROJECT" });
    },
    []
  );

  useEffect(() => {
    return subscribe((message) => {
      if (message?.type === "project-deleted" && activeProjectIdRef.current === message.projectId) {
        dispatch({ type: "CLOSE_PROJECT" });
        notify("This project was deleted in another tab.", { type: "warning" });
      }
    });
  }, [notify]);

  const openFile = useCallback(async (entry) => {
    dispatch({ type: "OPEN_FILE", entryId: entry.id, content: entry.content });
    await recentItemsRepository.trackFile(entry.id, entry.projectId);
  }, []);

  const updateTabContent = useCallback((entryId, content) => {
    dispatch({ type: "UPDATE_TAB_CONTENT", entryId, content });
  }, []);

  const saveTab = useCallback(
    async (entryId, content) => {
      try {
        const startedAt = performance.now();
        await entryRepository.updateContent(entryId, content);
        recordPerformanceEntry("IndexedDB write (save)", performance.now() - startedAt);
        dispatch({ type: "MARK_SAVED", entryId });
        notify("File saved", { type: "success", duration: 2000 });
      } catch {
        notify("Couldn't save file — local storage may be unavailable.", { type: "error" });
      }
    },
    [notify]
  );

  const closeTab = useCallback((entryId) => dispatch({ type: "CLOSE_TAB", entryId }), []);
  const closeAllTabs = useCallback(() => dispatch({ type: "CLOSE_ALL_TABS" }), []);
  const setActiveTab = useCallback((entryId) => dispatch({ type: "SET_ACTIVE_TAB", entryId }), []);

  const value = useMemo(
    () => ({
      ...state,
      openProject,
      closeProject,
      deleteProject,
      openFile,
      updateTabContent,
      saveTab,
      closeTab,
      closeAllTabs,
      setActiveTab,
    }),
    [state, openProject, closeProject, deleteProject, openFile, updateTabContent, saveTab, closeTab, closeAllTabs, setActiveTab]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
