// Registered only in production builds — running a service worker against
// the Vite dev server fights HMR (stale cached modules), so `npm run dev`
// stays SW-free and `npm run build && npm run preview` is how to exercise it.
export function registerServiceWorker(onUpdateAvailable) {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              onUpdateAvailable?.();
            }
          });
        });
      })
      .catch(() => {
        // Offline capability degrades gracefully — the app still runs, just
        // without shell precaching, since all real data lives in IndexedDB.
      });
  });
}
