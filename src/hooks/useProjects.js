import { useLiveCollection } from "./useIndexedDB";
import { projectRepository } from "../db/repositories/projectRepository";

export function useProjects() {
  return useLiveCollection(() => projectRepository.list(), []);
}
