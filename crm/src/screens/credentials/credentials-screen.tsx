import { ExternalLink, KeyRound, Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import {
  createCredential,
  deleteCredential,
  listCredentials,
  updateCredential,
  type Credential,
  type CredentialInput,
} from "@/api/credentials";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Textarea,
} from "@/components/ui";
import { describeDeadline, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { fee } from "@/lib/money";

/**
 * Справочник учёток сервисов — **без паролей**.
 *
 * Отвечает на «что у нас вообще есть», «на кого записано» и «когда продлевать».
 * Пароли живут в менеджере паролей: база уезжает в дампы по расписанию, и одна
 * их утечка отдала бы разом все сервисы. Поле «Где пароль» подсказывает, куда
 * идти, — этого достаточно, чтобы справочник был полезен.
 */
interface FormValues {
  service: string;
  login: string;
  url: string;
  owner: string;
  secretHint: string;
  renewsDate: string;
  amount: string;
  monthlyFee: boolean;
  notes: string;
}

function empty(): FormValues {
  return {
    service: "",
    login: "",
    url: "",
    owner: "",
    secretHint: "",
    renewsDate: "",
    amount: "",
    monthlyFee: false,
    notes: "",
  };
}

function toValues(item: Credential): FormValues {
  return {
    service: item.service,
    login: item.login ?? "",
    url: item.url ?? "",
    owner: item.owner ?? "",
    secretHint: item.secretHint ?? "",
    renewsDate: toDateInputValue(item.renewsAt),
    amount: item.amount == null ? "" : String(item.amount),
    monthlyFee: item.monthlyFee ?? false,
    notes: item.notes ?? "",
  };
}

function toInput(values: FormValues): CredentialInput {
  return {
    service: values.service.trim(),
    login: values.login.trim() || null,
    url: values.url.trim() || null,
    owner: values.owner.trim() || null,
    secretHint: values.secretHint.trim() || null,
    renewsAt: fromDateInputValue(values.renewsDate),
    amount: values.amount ? Number(values.amount) : null,
    monthlyFee: values.monthlyFee,
    notes: values.notes.trim() || null,
  };
}

export function CredentialsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Credential[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    setError(null);
    listCredentials(debouncedSearch || undefined)
      .then(setItems)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setItems([]);
      });
  }, [debouncedSearch]);

  useEffect(load, [load]);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Доступы</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2.5} />
          Новая запись
        </Button>
      </header>

      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        Что за сервис, на кого оформлен и когда продлевать.{" "}
        <b className="text-foreground">Паролей здесь нет</b> — им место в менеджере
        паролей, а поле «Где пароль» подскажет, в каком.
      </p>

      <div className="mt-5">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по сервису, логину или заметкам"
          className="w-full sm:w-80"
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-5">
        {items === null ? (
          <p className="text-muted-foreground text-sm">Загружаем…</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Пока пусто"
            note="Заведите первую запись — хостинг, домены, почта, аналитика."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <Row key={item.id} item={item} onOpen={() => setEditing(item)} />
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <CredentialModal
          title="Новая запись"
          initial={empty()}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createCredential(toInput(values));
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <CredentialModal
          title={editing.service}
          initial={toValues(editing)}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await updateCredential(editing.id, toInput(values));
            setEditing(null);
            load();
          }}
          onDelete={async () => {
            await deleteCredential(editing.id);
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
}

function Row({ item, onOpen }: { item: Credential; onOpen: () => void }) {
  const renews = item.renewsAt ? describeDeadline(item.renewsAt) : null;

  return (
    <li className="border-border bg-background hover:border-accent-border flex items-start gap-3 rounded-xl border px-3 py-2.5 transition hover:shadow-sm">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">{item.service}</span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[item.login, item.owner && `на ${item.owner}`, item.secretHint]
            .filter(Boolean)
            .join(" · ") || "подробности не заполнены"}
        </span>
      </button>

      {item.amount != null && (
        <span className="mt-0.5 shrink-0 text-sm font-medium">
          {fee(item.amount, item.monthlyFee)}
        </span>
      )}

      {renews && (
        <Badge tone={renews.tone} className="mt-0.5">
          {renews.label}
        </Badge>
      )}

      {item.url && (
        <a
          href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Открыть сервис"
          className="text-muted-foreground hover:bg-muted hover:text-foreground mt-0.5 shrink-0 rounded-lg p-1.5 transition"
        >
          <ExternalLink size={15} strokeWidth={2} />
        </a>
      )}
    </li>
  );
}

function CredentialModal({
  title,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial: FormValues;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Удалить запись?")) return;
    setSaving(true);
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Field label="Сервис">
            <Input
              value={values.service}
              onChange={(event) => set("service", event.target.value)}
              required
              autoFocus
              maxLength={120}
              placeholder="reg.ru · Яндекс Метрика · Cloudflare"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Логин">
              <Input
                value={values.login}
                onChange={(event) => set("login", event.target.value)}
                maxLength={200}
              />
            </Field>

            <Field label="На кого оформлен" hint="Чья почта или карта привязана">
              <Input
                value={values.owner}
                onChange={(event) => set("owner", event.target.value)}
                maxLength={120}
                placeholder="Камиль"
              />
            </Field>
          </div>

          <Field label="Ссылка">
            <Input
              value={values.url}
              onChange={(event) => set("url", event.target.value)}
              maxLength={300}
              placeholder="https://reg.ru"
            />
          </Field>

          <Field
            label="Где пароль"
            hint="Не сам пароль, а где он лежит — сюда секреты не пишем"
          >
            <Input
              value={values.secretHint}
              onChange={(event) => set("secretHint", event.target.value)}
              maxLength={200}
              placeholder="Bitwarden, папка «Хостинг»"
            />
          </Field>

          <Field label="Продлить до" hint="Попадёт наверх списка, когда срок подойдёт">
            <Input
              type="date"
              value={values.renewsDate}
              onChange={(event) => set("renewsDate", event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Сумма" hint="Рубли, целыми. Можно оставить пустым">
              <Input
                value={values.amount}
                onChange={(event) =>
                  set("amount", event.target.value.replace(/[^\d]/g, ""))
                }
                inputMode="numeric"
                placeholder="1200"
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-2.5 sm:mt-7">
              <input
                type="checkbox"
                checked={values.monthlyFee}
                onChange={(event) => set("monthlyFee", event.target.checked)}
                className="accent-accent mt-0.5 size-4 shrink-0"
              />
              <span className="text-sm">
                Списывается каждый месяц
                <span className="text-muted-foreground mt-0.5 block text-sm">
                  Иначе сумма считается платой за период продления
                </span>
              </span>
            </label>
          </div>

          <Field label="Заметки">
            <Textarea
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
              rows={3}
              placeholder="Тариф, что именно там лежит, к кому идти за доступом"
            />
          </Field>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="danger"
              className="ml-auto"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              Удалить
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export { KeyRound as CredentialsIcon };
