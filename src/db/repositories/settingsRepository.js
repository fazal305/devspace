import { db } from "../database";

// Generic key/value store for workspace-level settings that are meaningful
// enough to persist transactionally (editor preferences, last active project).
// Trivial layout-only UI state (sidebar width, panel collapsed) stays in
// localStorage via SettingsContext — see item 16 of the product spec.
export const settingsRepository = {
  async get(key, fallback = null) {
    const row = await db.settings.get(key);
    return row ? row.value : fallback;
  },

  async set(key, value) {
    await db.settings.put({ key, value });
  },

  async getAll() {
    const rows = await db.settings.toArray();
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },
};
