import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/api/client";

/** marketing видит только лиды — запрет продублирован на сервере. */
export type UserRole = "owner" | "editor" | "marketing";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/**
 * Три состояния вместо `user | null`: пока идёт первая проверка сессии, нельзя
 * ни показать приложение, ни выкинуть на форму входа — иначе при каждом
 * обновлении страницы моргает логин.
 */
type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "anonymous" };

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // Кука httpOnly, прочитать её из JS нельзя — про наличие сессии спрашиваем
  // сервер. Это же проверяет, что API вообще доступен.
  useEffect(() => {
    let cancelled = false;

    api
      .get<{ user: User }>("/auth/me")
      .then(({ user }) => {
        if (!cancelled) setState({ status: "authenticated", user });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.post<{ user: User }>("/auth/login", { email, password });
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post<void>("/auth/logout");
    } catch (error) {
      // Сессия могла истечь сама — для пользователя это всё равно выход.
      if (!(error instanceof ApiError)) throw error;
    }
    setState({ status: "anonymous" });
  }, []);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth вызван вне AuthProvider");
  return context;
}

/** Пользователь внутри защищённой части — там он гарантированно есть. */
export function useCurrentUser(): User {
  const { state } = useAuth();
  if (state.status !== "authenticated") {
    throw new Error("useCurrentUser вызван вне защищённого маршрута");
  }
  return state.user;
}
