/**
 * Вход в панель.
 *
 * Панель умеет работать в двух режимах, и выбирает его переменная окружения:
 *
 *  - `api` — задан `NEXT_PUBLIC_ADMIN_API_URL`: вход по почте и паролю, сессия
 *    в httpOnly-куке, данные в PostgreSQL (см. server/ и docs/backend.md);
 *  - `github` — переменной нет: старый режим с личным токеном GitHub.
 *
 * Оба режима закрывают один и тот же интерфейс `CasesApi`, поэтому остальная
 * панель про этот выбор не знает.
 */

export const ADMIN_API_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "").replace(
  /\/+$/,
  "",
);

export type AdminMode = "api" | "github";

export const ADMIN_MODE: AdminMode = ADMIN_API_BASE ? "api" : "github";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/** Все запросы к API идут с кукой — без этого сессия не поедет. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${ADMIN_API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });
}

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; problems?: string[] };
    if (body.problems?.length) return body.problems.join("; ");
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

/** Кто вошёл, или null. Используется при открытии панели. */
export async function fetchCurrentUser(): Promise<AdminUser | null> {
  const response = await apiFetch("/auth/me");
  if (!response.ok) return null;
  const body = (await response.json()) as { user: AdminUser };
  return body.user;
}

export async function signIn(email: string, password: string): Promise<AdminUser> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        response.status === 429
          ? "Слишком много попыток входа. Подожди несколько минут."
          : "Не удалось войти",
      ),
    );
  }

  const body = (await response.json()) as { user: AdminUser };
  return body.user;
}

export async function signOut(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
