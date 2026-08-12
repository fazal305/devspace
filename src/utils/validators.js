const RESERVED_NAME_CHARS = /[/\\:*?"<>|]/;

export function validateProjectName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "Project name can't be empty.";
  if (trimmed.length > 80) return "Project name is too long.";
  return null;
}

export function validateEntryName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "Name can't be empty.";
  if (trimmed === "." || trimmed === "..") return "That name isn't allowed.";
  if (RESERVED_NAME_CHARS.test(trimmed)) return `Name can't contain ${'/ \\ : * ? " < > |'}`;
  if (trimmed.length > 120) return "Name is too long.";
  return null;
}

export function validateSnippetTitle(title) {
  const trimmed = title.trim();
  if (!trimmed) return "Snippet title can't be empty.";
  if (trimmed.length > 100) return "Title is too long.";
  return null;
}
