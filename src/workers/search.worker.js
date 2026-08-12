// Runs substring search across every file's content off the main thread so
// large workspaces don't freeze the UI while scanning.

function runSearch(query, files) {
  if (!query || query.trim().length === 0) return [];
  const needle = query.toLowerCase();
  const matches = [];

  for (const file of files) {
    const lines = file.content.split("\n");
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(needle)) {
        matches.push({
          entryId: file.id,
          projectId: file.projectId,
          name: file.name,
          line: index + 1,
          preview: line.trim().slice(0, 160),
        });
      }
    });
  }
  return matches;
}

self.onmessage = (event) => {
  const { requestId, type, payload } = event.data;
  try {
    if (type !== "search") throw new Error(`Unknown search worker task: ${type}`);
    const result = runSearch(payload.query, payload.files);
    self.postMessage({ requestId, result });
  } catch (err) {
    self.postMessage({ requestId, error: err.message });
  }
};
