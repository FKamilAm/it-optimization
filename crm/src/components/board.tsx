import { useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Доска с колонками и перетаскиванием.
 *
 * На HTML5 drag-and-drop, без библиотеки: карточек десятки, а не тысячи, и
 * @dnd-kit с его сенсорами и коллизиями стоил бы 40 КБ ради того, что браузер
 * умеет сам. Плата — перетаскивание не работает на телефоне, поэтому статус
 * там меняется через карточку, и список остаётся полноценным способом работы.
 */

export interface BoardColumn<T> {
  key: string;
  label: string;
  items: T[];
}

export function Board<T extends { id: string }>({
  columns,
  renderCard,
  onMove,
}: {
  columns: BoardColumn<T>[];
  renderCard: (item: T) => ReactNode;
  /**
   * Куда и в каком порядке. `ids` — весь новый состав колонки: частичные
   * операции над множеством дают гонки, когда двое двигают карточки разом.
   */
  onMove: (columnKey: string, ids: string[]) => void;
}) {
  const [dragging, setDragging] = useState<{ id: string; from: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function handleDrop(event: DragEvent, columnKey: string) {
    event.preventDefault();
    setOver(null);
    const current = dragging;
    setDragging(null);
    if (!current) return;

    const target = columns.find((column) => column.key === columnKey);
    if (!target) return;

    // Карточка встаёт в конец колонки. Точное место внутри колонки для трёх
    // человек значения не имеет, а вычисление позиции под курсором добавляет
    // заметно больше кода, чем пользы.
    const ids = target.items.map((item) => item.id).filter((id) => id !== current.id);
    ids.push(current.id);
    onMove(columnKey, ids);
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {columns.map((column) => (
        <div
          key={column.key}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(column.key);
          }}
          onDragLeave={() =>
            setOver((current) => (current === column.key ? null : current))
          }
          onDrop={(event) => handleDrop(event, column.key)}
          className={cn(
            "flex w-64 shrink-0 flex-col rounded-xl border p-2 transition",
            over === column.key
              ? "border-accent-border bg-accent-muted"
              : "border-border bg-muted/40",
          )}
        >
          <div className="flex items-baseline justify-between px-1.5 py-1">
            <span className="text-sm font-semibold">{column.label}</span>
            <span className="text-muted-foreground text-xs">{column.items.length}</span>
          </div>

          <div className="mt-1 flex flex-col gap-2">
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragging({ id: item.id, from: column.key })}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                className={cn(
                  "border-border bg-background cursor-grab rounded-lg border p-2.5 transition active:cursor-grabbing",
                  dragging?.id === item.id && "opacity-40",
                )}
              >
                {renderCard(item)}
              </div>
            ))}

            {column.items.length === 0 && (
              <p className="text-muted-foreground px-1.5 py-3 text-xs">Пусто</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
