import { db } from "../database";

function now() {
  return new Date().toISOString();
}

export const snippetRepository = {
  list() {
    return db.snippets.orderBy("updatedAt").reverse().toArray();
  },

  get(id) {
    return db.snippets.get(id);
  },

  async create({ title, description = "", language, code, tags = [], favorite = false }) {
    const snippet = {
      id: crypto.randomUUID(),
      title,
      description,
      language,
      code,
      tags,
      favorite,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.snippets.add(snippet);
    return snippet;
  },

  async update(id, patch) {
    await db.snippets.update(id, { ...patch, updatedAt: now() });
  },

  async toggleFavorite(id) {
    const snippet = await db.snippets.get(id);
    if (!snippet) return;
    await db.snippets.update(id, { favorite: !snippet.favorite, updatedAt: now() });
  },

  async remove(id) {
    await db.snippets.delete(id);
  },
};
