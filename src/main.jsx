import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./app/App";
import { registerServiceWorker } from "./services/serviceWorkerRegistration";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);

registerServiceWorker(() => {
  window.dispatchEvent(new CustomEvent("devspace:sw-update"));
});
