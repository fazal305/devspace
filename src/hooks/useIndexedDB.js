import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";

// Shared reactive-query wrapper: every domain hook (useProjects, useSnippets,
// useProjectEntries) is a one-line call to this, so loading/error handling
// for IndexedDB reads lives in exactly one place.
export function useLiveCollection(querier, deps = [], fallback = []) {
  const [error, setError] = useState(null);

  const data = useLiveQuery(async () => {
    try {
      const result = await querier();
      setError(null);
      return result;
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError(err);
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data: data ?? fallback, isLoading: data === undefined, error };
}
