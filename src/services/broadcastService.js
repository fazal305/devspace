// Cross-tab messaging so two DevSpace tabs open on the same origin stay
// consistent — e.g. deleting a project in one tab needs to close it in
// another tab that happens to have it open, since that's plain React state
// (WorkspaceContext), not something Dexie's live queries alone would catch.
export const isBroadcastSupported = typeof window !== "undefined" && "BroadcastChannel" in window;

const channel = isBroadcastSupported ? new BroadcastChannel("devspace") : null;

export function publish(message) {
  channel?.postMessage(message);
}

export function subscribe(handler) {
  if (!channel) return () => {};
  const listener = (event) => handler(event.data);
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}
