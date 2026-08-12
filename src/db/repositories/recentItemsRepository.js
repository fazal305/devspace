import { db } from "../database";

const MAX_TRACKED = 20;

async function trim(type) {
  const items = await db.recentItems.where("type").equals(type).sortBy("openedAt");
  const excess = items.length - MAX_TRACKED;
  if (excess > 0) {
    await db.recentItems.bulkDelete(items.slice(0, excess).map((item) => item.id));
  }
}

export const recentItemsRepository = {
  async trackProject(projectId) {
    await db.recentItems.add({
      id: crypto.randomUUID(),
      type: "project",
      refId: projectId,
      projectId,
      openedAt: new Date().toISOString(),
    });
    await trim("project");
  },

  async trackFile(entryId, projectId) {
    await db.recentItems.add({
      id: crypto.randomUUID(),
      type: "file",
      refId: entryId,
      projectId,
      openedAt: new Date().toISOString(),
    });
    await trim("file");
  },

  async listRecentProjects(limit = 5) {
    const items = await db.recentItems.where("type").equals("project").sortBy("openedAt");
    return items.reverse().slice(0, limit);
  },

  async listRecentFiles(limit = 8) {
    const items = await db.recentItems.where("type").equals("file").sortBy("openedAt");
    return items.reverse().slice(0, limit);
  },
};
