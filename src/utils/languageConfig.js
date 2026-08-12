// Central language registry driving file-language detection, editor syntax
// highlighting, and the language filter in Snippets/Search.

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", extensions: ["js", "mjs", "cjs"] },
  { id: "jsx", label: "JSX", extensions: ["jsx"] },
  { id: "html", label: "HTML", extensions: ["html", "htm"] },
  { id: "css", label: "CSS", extensions: ["css"] },
  { id: "json", label: "JSON", extensions: ["json"] },
  { id: "markdown", label: "Markdown", extensions: ["md", "markdown"] },
  { id: "xml", label: "XML", extensions: ["xml", "svg"] },
  { id: "sql", label: "SQL", extensions: ["sql"] },
];

export function detectLanguage(filename) {
  const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
  const match = LANGUAGES.find((lang) => lang.extensions.includes(ext));
  return match ? match.id : "plaintext";
}
