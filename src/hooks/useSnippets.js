import { useLiveCollection } from "./useIndexedDB";
import { snippetRepository } from "../db/repositories/snippetRepository";

export function useSnippets() {
  return useLiveCollection(() => snippetRepository.list(), []);
}
