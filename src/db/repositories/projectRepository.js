import { db } from "../database";

function now() {
  return new Date().toISOString();
}

export const projectRepository = {
  list() {
    return db.projects.orderBy("updatedAt").reverse().toArray();
  },

  get(id) {
    return db.projects.get(id);
  },

  async create({ name, description = "", template = null, favorite = false, settings = {} }) {
    const project = {
      id: crypto.randomUUID(),
      name,
      description,
      favorite,
      settings,
      template,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.projects.add(project);
    return project;
  },

  async rename(id, name) {
    await db.projects.update(id, { name, updatedAt: now() });
  },

  async update(id, patch) {
    await db.projects.update(id, { ...patch, updatedAt: now() });
  },

  async toggleFavorite(id) {
    const project = await db.projects.get(id);
    if (!project) return;
    await db.projects.update(id, { favorite: !project.favorite, updatedAt: now() });
  },

  async touch(id) {
    await db.projects.update(id, { updatedAt: now() });
  },

  async remove(id) {
    await db.transaction("rw", db.projects, db.entries, db.recentItems, async () => {
      await db.entries.where("projectId").equals(id).delete();
      await db.recentItems.where("projectId").equals(id).delete();
      await db.projects.delete(id);
    });
  },

  async duplicate(id) {
    return db.transaction("rw", db.projects, db.entries, async () => {
      const source = await db.projects.get(id);
      if (!source) throw new Error("Project not found.");

      const newProjectId = crypto.randomUUID();
      const timestamp = now();
      await db.projects.add({
        ...source,
        id: newProjectId,
        name: `${source.name} copy`,
        favorite: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      const sourceEntries = await db.entries.where("projectId").equals(id).toArray();
      const idMap = new Map(sourceEntries.map((entry) => [entry.id, crypto.randomUUID()]));
      const clonedEntries = sourceEntries.map((entry) => ({
        ...entry,
        id: idMap.get(entry.id),
        projectId: newProjectId,
        parentId: entry.parentId ? idMap.get(entry.parentId) : null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
      if (clonedEntries.length > 0) await db.entries.bulkAdd(clonedEntries);

      return newProjectId;
    });
  },
};
