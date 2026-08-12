import { db } from "../database";
import { getDescendantIds, isDescendant } from "../../utils/fileTree";

function now() {
  return new Date().toISOString();
}

export const entryRepository = {
  listByProject(projectId) {
    return db.entries.where("projectId").equals(projectId).toArray();
  },

  listChildren(projectId, parentId = null) {
    return db.entries.where("[projectId+parentId]").equals([projectId, parentId]).toArray();
  },

  async listRecentFiles(limit = 8) {
    const files = await db.entries.where("type").equals("file").sortBy("updatedAt");
    return files.reverse().slice(0, limit);
  },

  listAllFiles() {
    return db.entries.where("type").equals("file").toArray();
  },

  listAll() {
    return db.entries.toArray();
  },

  // Materializes a starter template's flat `{ path, language, content }[]`
  // into real folder/file rows, creating intermediate folders as needed.
  async seedFromTemplate(projectId, templateEntries) {
    if (!templateEntries || templateEntries.length === 0) return;

    const folderIdByPath = new Map();
    const timestamp = now();
    const rows = [];

    function ensureFolder(segments) {
      if (segments.length === 0) return null;
      const path = segments.join("/");
      if (folderIdByPath.has(path)) return folderIdByPath.get(path);

      const parentId = ensureFolder(segments.slice(0, -1));
      const id = crypto.randomUUID();
      rows.push({
        id,
        projectId,
        parentId,
        name: segments[segments.length - 1],
        type: "folder",
        language: null,
        content: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      folderIdByPath.set(path, id);
      return id;
    }

    for (const { path, language, content } of templateEntries) {
      const segments = path.split("/");
      const fileName = segments[segments.length - 1];
      const parentId = ensureFolder(segments.slice(0, -1));
      rows.push({
        id: crypto.randomUUID(),
        projectId,
        parentId,
        name: fileName,
        type: "file",
        language,
        content,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await db.entries.bulkAdd(rows);
  },

  get(id) {
    return db.entries.get(id);
  },

  async create({ projectId, parentId = null, name, type, language = null, content = "" }) {
    const entry = {
      id: crypto.randomUUID(),
      projectId,
      parentId,
      name,
      type,
      language: type === "file" ? language : null,
      content: type === "file" ? content : "",
      createdAt: now(),
      updatedAt: now(),
    };
    await db.entries.add(entry);
    await db.projects.update(projectId, { updatedAt: now() });
    return entry;
  },

  async rename(id, name) {
    const entry = await db.entries.get(id);
    if (!entry) return;
    await db.entries.update(id, { name, updatedAt: now() });
    await db.projects.update(entry.projectId, { updatedAt: now() });
  },

  async updateContent(id, content) {
    const entry = await db.entries.get(id);
    if (!entry) return;
    await db.entries.update(id, { content, updatedAt: now() });
    await db.projects.update(entry.projectId, { updatedAt: now() });
  },

  async move(id, newParentId) {
    const entry = await db.entries.get(id);
    if (!entry) return;

    if (entry.id === newParentId) throw new Error("Can't move an item into itself.");
    if (entry.type === "folder") {
      const siblings = await db.entries.where("projectId").equals(entry.projectId).toArray();
      if (newParentId && isDescendant(siblings, newParentId, entry.id)) {
        throw new Error("Can't move a folder into its own subfolder.");
      }
    }

    await db.entries.update(id, { parentId: newParentId, updatedAt: now() });
    await db.projects.update(entry.projectId, { updatedAt: now() });
  },

  async remove(id) {
    const entry = await db.entries.get(id);
    if (!entry) return;

    await db.transaction("rw", db.entries, db.projects, async () => {
      if (entry.type === "folder") {
        const siblings = await db.entries.where("projectId").equals(entry.projectId).toArray();
        const descendantIds = getDescendantIds(siblings, id);
        if (descendantIds.length > 0) await db.entries.bulkDelete(descendantIds);
      }
      await db.entries.delete(id);
      await db.projects.update(entry.projectId, { updatedAt: now() });
    });
  },

  async duplicate(id) {
    return db.transaction("rw", db.entries, db.projects, async () => {
      const entry = await db.entries.get(id);
      if (!entry) throw new Error("Entry not found.");

      const timestamp = now();
      const newId = crypto.randomUUID();
      await db.entries.add({
        ...entry,
        id: newId,
        name: entry.type === "file" ? `${entry.name} copy` : `${entry.name} copy`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      if (entry.type === "folder") {
        const siblings = await db.entries.where("projectId").equals(entry.projectId).toArray();
        const descendantIds = getDescendantIds(siblings, id);
        const idMap = new Map([[id, newId]]);
        const descendants = siblings.filter((e) => descendantIds.includes(e.id));
        for (const descendant of descendants) idMap.set(descendant.id, crypto.randomUUID());

        const clones = descendants.map((descendant) => ({
          ...descendant,
          id: idMap.get(descendant.id),
          parentId: idMap.get(descendant.parentId),
          createdAt: timestamp,
          updatedAt: timestamp,
        }));
        if (clones.length > 0) await db.entries.bulkAdd(clones);
      }

      await db.projects.update(entry.projectId, { updatedAt: timestamp });
      return newId;
    });
  },
};
