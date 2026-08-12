import { useLiveCollection } from "./useIndexedDB";
import { entryRepository } from "../db/repositories/entryRepository";

export function useProjectEntries(projectId) {
  return useLiveCollection(() => (projectId ? entryRepository.listByProject(projectId) : []), [projectId]);
}

export function useRecentFiles(limit = 8) {
  return useLiveCollection(() => entryRepository.listRecentFiles(limit), [limit]);
}
