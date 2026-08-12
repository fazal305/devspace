import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./app/App";
import { registerServiceWorker } from "./services/serviceWorkerRegistration";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker(() => {
  window.dispatchEvent(new CustomEvent("devspace:sw-update"));
});
