import { AppProviders } from "./providers";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { ToastContainer } from "../components/common/ToastContainer";
import { AppShell } from "../components/layout/AppShell";

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppShell />
        <ToastContainer />
      </AppProviders>
    </ErrorBoundary>
  );
}
