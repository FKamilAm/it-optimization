import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/auth-context";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Не получилось войти. Попробуй ещё раз.",
      );
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="bg-accent mb-3 h-2 w-10 rounded-full" />
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Внутренняя система «Айти-Оптимизации»
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Почта</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="border-border bg-background focus:border-accent w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="border-border bg-background focus:border-accent w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="bg-danger-soft text-danger rounded-lg px-3 py-2.5 text-sm"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-surface text-surface-foreground w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Входим…" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}
