import JSZip from "jszip";
import { projectRepository } from "../db/repositories/projectRepository";
import { entryRepository } from "../db/repositories/entryRepository";
import { detectLanguage } from "../utils/languageConfig";

const METADATA_PATH = ".devspace/project.json";
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB — keeps IndexedDB rows and the editor responsive
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "ico", "bmp", "webp", "pdf", "zip", "gz", "tar",
  "woff", "woff2", "ttf", "eot", "otf", "mp3", "mp4", "mov", "avi", "exe", "dll", "so", "bin", "class", "jar",
]);
const IGNORED_PATH_SEGMENTS = new Set(["__MACOSX", ".DS_Store", ".git", "node_modules"]);
const RESERVED_NAME_CHARS = /[\\:*?"<>|]/;

function sanitizeSegment(segment) {
  const trimmed = segment.trim();
  if (!trimmed || trimmed === "." || trimmed === "..") return null; // blocks path traversal
  if (RESERVED_NAME_CHARS.test(trimmed)) return null;
  return trimmed;
}

function sanitizePath(rawPath) {
  const segments = rawPath.split("/").filter(Boolean);
  const cleaned = [];
  for (const segment of segments) {
    if (IGNORED_PATH_SEGMENTS.has(segment)) return null;
    const safe = sanitizeSegment(segment);
    if (!safe) return null;
    cleaned.push(safe);
  }
  return cleaned.length > 0 ? cleaned.join("/") : null;
}

function extensionOf(path) {
  const name = path.split("/").pop();
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
}

// If every file shares one top-level folder, treat that as the project name
// and strip it — a folder zipped via "Compress" on macOS/Windows nests
// everything one level deep, and re-nesting that inside a DevSpace project
// of the same name would just duplicate the folder.
function stripCommonRoot(paths) {
  if (paths.length === 0) return { root: null, strip: (p) => p };
  const candidate = paths[0].split("/")[0];
  const allNested = paths.every((p) => {
    const segments = p.split("/");
    return segments.length > 1 && segments[0] === candidate;
  });
  if (!allNested) return { root: null, strip: (p) => p };
  return { root: candidate, strip: (p) => p.split("/").slice(1).join("/") };
}

export async function parseProjectArchive(file) {
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("That file isn't a valid zip archive.");
  }

  const zipEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (zipEntries.length === 0) throw new Error("The archive is empty.");

  const warnings = [];
  let skipped = 0;
  const rawFiles = [];
  let metadata = null;

  for (const entry of zipEntries) {
    const path = sanitizePath(entry.name);
    if (!path) {
      skipped += 1;
      continue;
    }
    if (path === METADATA_PATH) {
      try {
        metadata = JSON.parse(await entry.async("string"));
      } catch {
        warnings.push("Project metadata was present but couldn't be read — using defaults instead.");
      }
      continue;
    }
    if (BINARY_EXTENSIONS.has(extensionOf(path))) {
      skipped += 1;
      continue;
    }

    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_FILE_BYTES) {
      skipped += 1;
      warnings.push(`Skipped "${path}" — larger than 2MB.`);
      continue;
    }

    rawFiles.push({ path, content: new TextDecoder("utf-8", { fatal: false }).decode(bytes) });
  }

  if (rawFiles.length === 0) throw new Error("No importable text files were found in the archive.");

  const { root, strip } = stripCommonRoot(rawFiles.map((f) => f.path));
  const files = rawFiles.map((f) => ({ path: strip(f.path), language: detectLanguage(f.path), content: f.content }));

  const folderPaths = new Set();
  for (const f of files) {
    const segments = f.path.split("/").slice(0, -1);
    for (let i = 1; i <= segments.length; i += 1) folderPaths.add(segments.slice(0, i).join("/"));
  }

  return {
    suggestedName: metadata?.name ?? root ?? file.name.replace(/\.zip$/i, ""),
    metadata,
    files,
    stats: { filesImported: files.length, foldersImported: folderPaths.size, skipped, warnings },
  };
}

// Archive → parse/validate → repository writes → workspace state (the last
// step is the caller's job: this returns the created project for it to open).
export async function importProjectFromZip(file) {
  const parsed = await parseProjectArchive(file);
  const project = await projectRepository.create({
    name: parsed.suggestedName,
    description: parsed.metadata?.description ?? "",
    settings: parsed.metadata?.settings ?? {},
    favorite: false,
  });
  await entryRepository.seedFromTemplate(project.id, parsed.files);
  return { project, stats: parsed.stats };
}
