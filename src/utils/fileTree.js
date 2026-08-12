// Pure helpers over a flat `entries` array (as stored in IndexedDB).
// Keeping tree logic here — instead of scattered through components —
// means the explorer, search, and export pipeline all walk the same shape.

export function buildTree(entries, parentId = null) {
  return entries
    .filter((entry) => entry.parentId === parentId)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => ({
      ...entry,
      children: entry.type === "folder" ? buildTree(entries, entry.id) : undefined,
    }));
}

export function getDescendantIds(entries, rootId) {
  const childrenByParent = new Map();
  for (const entry of entries) {
    const list = childrenByParent.get(entry.parentId) ?? [];
    list.push(entry.id);
    childrenByParent.set(entry.parentId, list);
  }

  const result = [];
  const queue = [...(childrenByParent.get(rootId) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift();
    result.push(id);
    queue.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}

export function getEntryPath(entries, entryId) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const segments = [];
  let current = byId.get(entryId);
  while (current) {
    segments.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return segments.join("/");
}

export function isDescendant(entries, candidateId, ancestorId) {
  return getDescendantIds(entries, ancestorId).includes(candidateId);
}
