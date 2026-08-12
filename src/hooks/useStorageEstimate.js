import { useEffect, useState } from "react";

const isSupported = typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage;

export function useStorageEstimate() {
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    if (!isSupported) return;
    navigator.storage.estimate().then(({ usage, quota }) => setEstimate({ usage, quota }));
  }, []);

  return { isSupported, usage: estimate?.usage ?? null, quota: estimate?.quota ?? null };
}
