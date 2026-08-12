import { ThemeProvider } from "../context/ThemeContext";
import { SettingsProvider } from "../context/SettingsContext";
import { NotificationProvider } from "../context/NotificationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <NotificationProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </NotificationProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
