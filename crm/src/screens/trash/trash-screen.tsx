import { RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  emptyTrash,
  getTrash,
  purgeItem,
  restoreItem,
  type TrashItem,
} from "@/api/trash";
import { Badge, Button, EmptyState, ErrorNote } from "@/components/ui";
import { daysFromToday, formatDate } from "@/lib/dates";

/**
 * Корзина.
 *
 * До неё удаление было односторонним: запись исчезала с экрана и оставалась в
 * базе навсегда — вернуть нельзя, а место занимает. Теперь у мягкого удаления
 * появился смысл: тридцать дней на передумать, потом чисто.
 */
export function TrashScreen() {
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [retention, setRetention] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const load = useCallback(() => {
    setError(null);
    getTrash()
      .then((trash) => {
        setItems(trash.items);
        setRetention(trash.retentionDays);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setItems([]);
      });
  }, []);

  useEffect(load, [load]);

  async function act(item: TrashItem, action: "restore" | "purge") {
    if (
      action === "purge" &&
      !confirm(`Удалить «${item.title}» насовсем? Вернуть будет нельзя.`)
    ) {
      return;
    }

    setBusy(item.id);
    setError(null);
    try {
      await (action === "restore"
        ? restoreItem(item.entity, item.id)
        : purgeItem(item.entity, item.id));
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не получилось");
    } finally {
      setBusy(null);
    }
  }

  async function empty() {
    const count = items?.length ?? 0;
    // Счёт прямо в вопросе: «очистить корзину?» звучит безобидно, а за ним
    // может стоять проект, который кто-то удалил по ошибке неделю назад.
    if (!confirm(`Удалить насовсем ${count} зап. из корзины? Вернуть будет нельзя.`)) {
      return;
    }

    setEmptying(true);
    setError(null);
    try {
      await emptyTrash();
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не получилось очистить");
    } finally {
      setEmptying(false);
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Корзина</h1>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            Удалённое хранится {retention} дней, потом исчезает насовсем. Проект
            возвращается вместе со своими задачами и заметками.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => void empty()}
          disabled={emptying || !items?.length}
        >
          <Trash2 size={16} strokeWidth={2} />
          {emptying ? "Очищаем…" : "Очистить корзину"}
        </Button>
      </header>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-5">
        {items === null ? (
          <p className="text-muted-foreground text-sm">Загружаем…</p>
        ) : items.length === 0 ? (
          <EmptyState title="Пусто" note="Ничего удалённого — и хорошо." />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <Row
                key={`${item.entity}:${item.id}`}
                item={item}
                retention={retention}
                busy={busy === item.id}
                onRestore={() => void act(item, "restore")}
                onPurge={() => void act(item, "purge")}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Row({
  item,
  retention,
  busy,
  onRestore,
  onPurge,
}: {
  item: TrashItem;
  retention: number;
  busy: boolean;
  onRestore: () => void;
  onPurge: () => void;
}) {
  // Сколько осталось, а не когда удалили: решение принимают по остатку срока.
  const left = retention + daysFromToday(item.deletedAt);

  return (
    <li className="border-border bg-background flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {/* Без «удалён»: подписи приходят с сервера и бывают женского рода
              («Статья»), а согласовать род на клиенте не по чему. */}
          {item.label} · в корзине с {formatDate(item.deletedAt)}
        </span>
      </div>

      <Badge tone={left <= 3 ? "danger" : "neutral"}>
        {left <= 0 ? "вот-вот исчезнет" : `${left} дн.`}
      </Badge>

      <div className="flex items-center gap-1">
        <Button variant="ghost" onClick={onRestore} disabled={busy}>
          <RotateCcw size={15} strokeWidth={2} />
          Вернуть
        </Button>
        <button
          type="button"
          onClick={onPurge}
          disabled={busy}
          aria-label="Удалить насовсем"
          title="Удалить насовсем"
          className="text-muted-foreground hover:bg-muted hover:text-danger rounded-lg p-2 transition"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>
    </li>
  );
}
