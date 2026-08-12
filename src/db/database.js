import Dexie from "dexie";

// Single IndexedDB database backing the entire workspace. Repositories are
// the only modules allowed to import this — components go through them.
export const db = new Dexie("devspace");

db.version(1).stores({
  projects: "id, name, favorite, updatedAt",
  // `entries` holds both files and folders in one self-referencing tree table.
  // [projectId+parentId] backs file-tree reads, [projectId+name] backs quick-open.
  entries: "id, projectId, parentId, [projectId+parentId], [projectId+name], type, updatedAt",
  snippets: "id, language, favorite, *tags, updatedAt",
  settings: "key",
  recentItems: "id, type, projectId, openedAt",
});
