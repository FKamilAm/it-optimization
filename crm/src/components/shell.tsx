import {
  Briefcase,
  Building2,
  CheckSquare,
  Inbox,
  LogOut,
  Settings,
  Sun,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth, useCurrentUser } from "@/auth/auth-context";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/", label: "Сегодня", icon: Sun, end: true },
  { to: "/leads", label: "Лиды", icon: Inbox, end: false },
  { to: "/projects", label: "Проекты", icon: Briefcase, end: false },
  { to: "/tasks", label: "Задачи", icon: CheckSquare, end: false },
  { to: "/clients", label: "Клиенты", icon: Building2, end: false },
] as const;

export function Shell() {
  const user = useCurrentUser();
  const { logout } = useAuth();

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* На узком экране навигация уезжает наверх в прокручиваемую строку:
          боковая колонка на телефоне съедает половину ширины. */}
      <nav className="border-border flex shrink-0 items-center gap-1 overflow-x-auto border-b px-3 py-2 md:w-56 md:flex-col md:items-stretch md:overflow-visible md:border-r md:border-b-0 md:px-3 md:py-5">
        <div className="mr-3 hidden items-center gap-2 px-2 pb-5 md:flex">
          <span className="bg-accent h-2 w-2 rounded-full" />
          <span className="text-sm font-bold tracking-tight">CRM</span>
        </div>

        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                isActive
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}

        <div className="ml-auto flex items-center gap-2 md:mt-auto md:ml-0 md:flex-col md:items-stretch md:pt-5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Settings size={16} strokeWidth={2} />
            <span className="hidden truncate md:inline">{user.name ?? user.email}</span>
          </NavLink>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
          >
            <LogOut size={16} strokeWidth={2} />
            <span className="hidden md:inline">Выйти</span>
          </button>
        </div>
      </nav>

      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
