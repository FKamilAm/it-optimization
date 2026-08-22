import { Check, Copy, ExternalLink, KeyRound, Lock, Plus } from "lucide-react";
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
import { useVault } from "@/vault/vault-context";
import { VaultControl } from "./vault-panel";

/**
 * Справочник учёток сервисов, включая пароли.
 *
 * Пароли шифруются здесь же, в браузере: на сервер уходит шифротекст, ключ
 * выводится из мастер-фразы и наружу не попадает. База по-прежнему уезжает в
 * ночные дампы, но теперь их утечка отдаёт нечитаемый текст, а не все сервисы
 * разом — раньше именно из-за этого паролей здесь не было вовсе.
 *
 * Отсюда правило, которое легко нарушить: открытый пароль существует только в
 * состоянии формы и в буфере обмена. Его нельзя ни отправить на сервер, ни
 * положить в localStorage, ни записать в журнал.
 *
 * `secretHint` остался для сервисов, пароль от которых лежит не здесь.
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
  /** Открытый пароль. Живёт только в состоянии формы — наружу уходит шифротекст. */
  secret: string;
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
    secret: "",
    notes: "",
  };
}

function toValues(item: Credential, secret: string): FormValues {
  return {
    service: item.service,
    login: item.login ?? "",
    url: item.url ?? "",
    owner: item.owner ?? "",
    secretHint: item.secretHint ?? "",
    renewsDate: toDateInputValue(item.renewsAt),
    amount: item.amount == null ? "" : String(item.amount),
    monthlyFee: item.monthlyFee ?? false,
    secret,
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

/** `writable` — можно ли сохранять пароль: расшифровать удалось или его нет. */
interface EditTarget {
  item: Credential;
  secret: string;
  writable: boolean;
}

export function CredentialsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Credential[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const { unlocked, encryptSecret, decryptSecret } = useVault();

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

  /**
   * Расшифровка при открытии карточки, а не при сохранении: тогда поле пароля
   * ведёт себя как все остальные — что видно, то и сохранится. Иначе пустое
   * поле означало бы то «не менять», то «стереть», и однажды стёрло бы.
   */
  async function openEdit(item: Credential) {
    if (!item.secret || !unlocked) {
      setEditing({ item, secret: "", writable: unlocked && !item.secret });
      return;
    }
    try {
      setEditing({ item, secret: await decryptSecret(item.secret), writable: true });
    } catch {
      // Ключ не подходит к этой записи — её пароль не трогаем вовсе.
      setEditing({ item, secret: "", writable: false });
    }
  }

  /**
   * Поле пароля опускается целиком, когда открытый текст недоступен: прислать
   * `null` значило бы стереть сохранённое только потому, что хранилище заперто.
   */
  async function buildInput(values: FormValues, writable: boolean) {
    const input = toInput(values);
    if (!writable) return input;
    return {
      ...input,
      secret: values.secret ? await encryptSecret(values.secret) : null,
    };
  }

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Доступы</h1>
        <div className="flex items-center gap-2">
          <VaultControl />
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Новая запись
          </Button>
        </div>
      </header>

      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        Что за сервис, на кого оформлен, когда продлевать и под каким паролем заходят.
        Пароли шифруются <b className="text-foreground">в браузере</b>: на сервер уходит
        только шифротекст, и прочитать его без мастер-фразы нельзя никому — включая тех, у
        кого есть доступ к серверу.
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
              <Row key={item.id} item={item} onOpen={() => void openEdit(item)} />
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <CredentialModal
          title="Новая запись"
          initial={empty()}
          secretWritable={unlocked}
          hasSecret={false}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createCredential(await buildInput(values, unlocked));
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <CredentialModal
          title={editing.item.service}
          initial={toValues(editing.item, editing.secret)}
          secretWritable={editing.writable}
          hasSecret={Boolean(editing.item.secret)}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await updateCredential(
              editing.item.id,
              await buildInput(values, editing.writable),
            );
            setEditing(null);
            load();
          }}
          onDelete={async () => {
            await deleteCredential(editing.item.id);
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

      <SecretButton item={item} />

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

/**
 * Пароль отдаётся в буфер обмена, а не на экран: он нужен, чтобы его вставить,
 * а показанный текст видят все, кто смотрит в монитор.
 */
function SecretButton({ item }: { item: Credential }) {
  const { unlocked, decryptSecret } = useVault();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!item.secret) return null;

  if (!unlocked) {
    return (
      <span
        title="Пароль сохранён — разблокируйте хранилище"
        className="text-muted-foreground mt-0.5 shrink-0 p-1.5 opacity-50"
      >
        <Lock size={15} strokeWidth={2} />
      </span>
    );
  }

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(await decryptSecret(item.secret!));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setFailed(true);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label="Скопировать пароль"
      title={failed ? "Не получилось скопировать" : "Скопировать пароль"}
      className="text-muted-foreground hover:bg-muted hover:text-foreground mt-0.5 shrink-0 rounded-lg p-1.5 transition"
    >
      {copied ? (
        <Check size={15} strokeWidth={2.5} className="text-success" />
      ) : (
        <Copy size={15} strokeWidth={2} />
      )}
    </button>
  );
}

function CredentialModal({
  title,
  initial,
  secretWritable,
  hasSecret,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial: FormValues;
  /** Хранилище открыто и пароль этой записи прочитан — значит его можно менять. */
  secretWritable: boolean;
  hasSecret: boolean;
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
            label="Пароль"
            hint={
              secretWritable
                ? "Шифруется в браузере. Пустое поле — пароль не хранится"
                : hasSecret
                  ? "Сохранён. Разблокируйте хранилище, чтобы увидеть или заменить"
                  : "Разблокируйте хранилище, чтобы сохранить пароль"
            }
          >
            <Input
              type="password"
              value={values.secret}
              onChange={(event) => set("secret", event.target.value)}
              disabled={!secretWritable}
              autoComplete="new-password"
              placeholder={secretWritable ? "" : "••••••••"}
              maxLength={500}
            />
          </Field>

          <Field
            label="Где пароль"
            hint="Если он лежит не здесь — например, в общем хранилище"
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
