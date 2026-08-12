import JSZip from "jszip";
import { buildTree } from "../utils/fileTree";

const METADATA_PATH = ".devspace/project.json";

function addTreeToZip(zip, nodes) {
  for (const node of nodes) {
    if (node.type === "folder") {
      addTreeToZip(zip.folder(node.name), node.children ?? []);
    } else {
      zip.file(node.name, node.content ?? "");
    }
  }
}

// IndexedDB → project model → file tree → archive. Kept out of any
// component: UI only calls exportProjectToZip, never touches JSZip directly.
export async function buildProjectZip(project, entries) {
  const zip = new JSZip();
  const metadata = {
    name: project.name,
    description: project.description,
    favorite: project.favorite,
    settings: project.settings,
    template: project.template,
    exportedAt: new Date().toISOString(),
  };
  zip.file(METADATA_PATH, JSON.stringify(metadata, null, 2));
  addTreeToZip(zip, buildTree(entries));
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name) {
  return name.replace(/[/\\:*?"<>|]/g, "-").trim() || "project";
}

export async function exportProjectToZip(project, entries) {
  const blob = await buildProjectZip(project, entries);
  downloadBlob(blob, `${sanitizeFilename(project.name)}.zip`);
}
