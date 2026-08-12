// Thin request/response protocol over postMessage, keyed by requestId, so
// callers get a promise-based API instead of managing onmessage by hand.
export function createWorkerClient(worker) {
  let nextRequestId = 1;
  const pending = new Map();

  worker.onmessage = (event) => {
    const { requestId, result, error } = event.data;
    const entry = pending.get(requestId);
    if (!entry) return;
    pending.delete(requestId);
    if (error) entry.reject(new Error(error));
    else entry.resolve(result);
  };

  worker.onerror = (event) => {
    for (const { reject } of pending.values()) reject(new Error(event.message));
    pending.clear();
  };

  function call(type, payload) {
    const requestId = nextRequestId++;
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      worker.postMessage({ requestId, type, payload });
    });
  }

  function terminate() {
    worker.terminate();
    pending.clear();
  }

  return { call, terminate };
}
