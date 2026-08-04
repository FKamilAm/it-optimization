import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Shell } from "@/components/shell";
import { AuthProvider, useAuth } from "@/auth/auth-context";
import { ClientsScreen } from "@/screens/clients/clients-screen";
import { LeadsScreen } from "@/screens/leads/leads-screen";
import { LoginScreen } from "@/screens/login";
import { ProjectsScreen } from "@/screens/projects/projects-screen";
import { SettingsScreen } from "@/screens/settings";
import { TasksScreen } from "@/screens/tasks/tasks-screen";
import { TodayScreen } from "@/screens/today/today-screen";

function Routed() {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span className="text-muted-foreground text-sm">Загружаем…</span>
      </div>
    );
  }

  if (state.status === "anonymous") return <LoginScreen />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<TodayScreen />} />
        <Route path="leads" element={<LeadsScreen />} />
        <Route path="projects" element={<ProjectsScreen />} />
        <Route path="tasks" element={<TasksScreen />} />
        <Route path="clients" element={<ClientsScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        {/* Неизвестный адрес — не ошибка, а промах: возвращаем на главную. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routed />
      </AuthProvider>
    </BrowserRouter>
  );
}
