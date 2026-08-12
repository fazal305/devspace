import { detectLanguage } from "../utils/languageConfig";

// Feature-detected — Firefox and Safari don't implement the File System
// Access API as of this writing. Callers must check this before offering
// the open/save-to-folder actions, and degrade gracefully when it's false.
export const isFileSystemAccessSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

async function readFilesRecursive(dirHandle, parentPath = "") {
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (handle.kind === "file") {
      const file = await handle.getFile();
      const content = await file.text();
      files.push({ path, language: detectLanguage(name), content });
    } else if (handle.kind === "directory") {
      files.push(...(await readFilesRecursive(handle, path)));
    }
  }
  return files;
}

// Opens the native folder picker and reads every file inside into a flat
// `{ path, language, content }[]` list — the same shape entryRepository's
// seedFromTemplate expects, so an imported folder becomes a project the same
// way a starter template does.
export async function pickAndReadDirectory() {
  if (!isFileSystemAccessSupported) throw new Error("File System Access API isn't supported in this browser.");
  const dirHandle = await window.showDirectoryPicker();
  const files = await readFilesRecursive(dirHandle);
  return { name: dirHandle.name, files };
}

async function writeTreeToDirectory(dirHandle, nodes) {
  for (const node of nodes) {
    if (node.type === "folder") {
      const childHandle = await dirHandle.getDirectoryHandle(node.name, { create: true });
      await writeTreeToDirectory(childHandle, node.children ?? []);
    } else {
      const fileHandle = await dirHandle.getFileHandle(node.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(node.content ?? "");
      await writable.close();
    }
  }
}

// Opens the native folder picker in read-write mode and recreates the given
// entry tree (from utils/fileTree buildTree) as real files/folders on disk.
export async function pickAndWriteProject(tree) {
  if (!isFileSystemAccessSupported) throw new Error("File System Access API isn't supported in this browser.");
  const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  await writeTreeToDirectory(dirHandle, tree);
  return dirHandle.name;
}
