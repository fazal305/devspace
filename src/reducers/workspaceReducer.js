export const initialWorkspaceState = {
  activeProjectId: null,
  openTabs: [], // { entryId, savedContent, draftContent, isDirty }
  activeTabId: null,
};

function nextActiveAfterClose(openTabs, closedEntryId, activeTabId) {
  if (activeTabId !== closedEntryId) return activeTabId;
  const index = openTabs.findIndex((tab) => tab.entryId === closedEntryId);
  const remaining = openTabs.filter((tab) => tab.entryId !== closedEntryId);
  if (remaining.length === 0) return null;
  return remaining[Math.max(0, index - 1)].entryId;
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case "OPEN_PROJECT":
      return { ...initialWorkspaceState, activeProjectId: action.projectId };

    case "CLOSE_PROJECT":
      return initialWorkspaceState;

    case "OPEN_FILE": {
      const existing = state.openTabs.find((tab) => tab.entryId === action.entryId);
      if (existing) return { ...state, activeTabId: action.entryId };
      const tab = {
        entryId: action.entryId,
        savedContent: action.content,
        draftContent: action.content,
        isDirty: false,
      };
      return { ...state, openTabs: [...state.openTabs, tab], activeTabId: action.entryId };
    }

    case "UPDATE_TAB_CONTENT":
      return {
        ...state,
        openTabs: state.openTabs.map((tab) =>
          tab.entryId === action.entryId
            ? { ...tab, draftContent: action.content, isDirty: action.content !== tab.savedContent }
            : tab
        ),
      };

    case "MARK_SAVED":
      return {
        ...state,
        openTabs: state.openTabs.map((tab) =>
          tab.entryId === action.entryId ? { ...tab, savedContent: tab.draftContent, isDirty: false } : tab
        ),
      };

    case "CLOSE_TAB":
      return {
        ...state,
        openTabs: state.openTabs.filter((tab) => tab.entryId !== action.entryId),
        activeTabId: nextActiveAfterClose(state.openTabs, action.entryId, state.activeTabId),
      };

    case "CLOSE_ALL_TABS":
      return { ...state, openTabs: [], activeTabId: null };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.entryId };

    default:
      return state;
  }
}
