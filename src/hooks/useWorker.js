import { useEffect, useRef, useState } from "react";
import { createWorkerClient } from "../services/workerClient";

// `createWorker` should return a fresh `new Worker(...)` instance. The client
// is built inside an effect (not during render) so React StrictMode's
// dev-only mount→unmount→mount cycle terminates the first worker and creates
// a real replacement, instead of leaving a dead worker behind in a ref.
export function useWorker(createWorker) {
  const createWorkerRef = useRef(createWorker);
  createWorkerRef.current = createWorker;
  const [client, setClient] = useState(null);

  useEffect(() => {
    const workerClient = createWorkerClient(createWorkerRef.current());
    setClient(workerClient);
    return () => workerClient.terminate();
  }, []);

  return client ?? { call: () => Promise.reject(new Error("Worker not ready yet")) };
}
