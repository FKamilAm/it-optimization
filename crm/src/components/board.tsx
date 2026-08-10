import { Plus } from "lucide-react";
import { useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Доска с колонками и перетаскиванием.
 *
 * На HTML5 drag-and-drop, без библиотеки: карточек десятки, а не тысячи, и
 * @dnd-kit с его сенсорами и разрешением коллизий стоил бы 40 КБ ради того,
 * что браузер умеет сам. Плата честная — перетаскивание не работает на
 * телефоне, поэтому статус там меняется через карточку, а список остаётся
 * полноценным способом работы.
 */

/** Цвет колонки — смыслом, а не для красоты: он же читается на карточках. */
export type ColumnTone = "neutral" | "accent" | "warning" | "success" | "danger";

const DOT: Record<ColumnTone, string> = {
  neutral: "bg-muted-foreground/40",
  accent: "bg-accent",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
};

export interface BoardColumn<T> {
  key: string;
  label: string;
  items: T[];
  tone?: ColumnTone;
}

export function Board<T extends { id: string }>({
  columns,
  renderCard,
  onMove,
  onAdd,
}: {
  columns: BoardColumn<T>[];
  renderCard: (item: T) => ReactNode;
  /**
   * Куда и в каком порядке. `ids` — весь новый состав колонки: частичные
   * операции над множеством дают гонки, когда двое двигают карточки разом.
   */
  onMove: (columnKey: string, ids: string[]) => void;
  /** Завести запись сразу в этой колонке — иначе статус пришлось бы менять после. */
  onAdd?: (columnKey: string) => void;
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

    // Карточка встаёт в конец колонки. Точное место внутри колонки на трёх
    // людях роли не играет, а вычисление позиции под курсором стоит заметно
    // больше кода, чем даёт пользы.
    const ids = target.items.map((item) => item.id).filter((id) => id !== current.id);
    ids.push(current.id);
    onMove(columnKey, ids);
  }

  return (
    // Колонки влезают целиком: горизонтальная прокрутка на доске означает, что
    // часть работы не видна, а ради неё доску и открывают. Ширина ограничена
    // сверху — на широком мониторе растянутая на 400 пикселей карточка с одной
    // строкой текста выглядит пустой. На узком экране — по две в ряд, там всё
    // равно нет перетаскивания и пользуются списком.
    <div
      className="grid [grid-template-columns:repeat(2,minmax(0,1fr))] justify-start gap-3 md:[grid-template-columns:repeat(var(--cols),minmax(0,19rem))]"
      style={{ "--cols": columns.length } as CSSProperties}
    >
      {columns.map((column) => {
        const active = over === column.key && dragging?.from !== column.key;

        return (
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
              "border-border bg-muted/30 flex min-w-0 flex-col rounded-2xl border p-2.5 transition-colors",
              active && "border-accent-border bg-accent-muted",
            )}
          >
            <div className="flex items-center gap-2 px-1.5 py-1">
              <span
                className={cn("size-2 rounded-full", DOT[column.tone ?? "neutral"])}
              />
              <span className="text-sm font-semibold">{column.label}</span>
              <span className="text-muted-foreground text-xs">{column.items.length}</span>
              {onAdd && (
                <button
                  type="button"
                  onClick={() => onAdd(column.key)}
                  aria-label={`Добавить в «${column.label}»`}
                  className="text-muted-foreground hover:bg-background hover:text-foreground ml-auto rounded-md p-1 transition"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-2.5">
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
                    // Фон задаёт сама карточка: цвет несёт смысл, и у задач с
                    // проектами он разный — доска в него не лезет.
                    "border-border cursor-grab overflow-hidden rounded-xl border shadow-sm transition active:cursor-grabbing",
                    "hover:border-accent-border hover:shadow-md",
                    dragging?.id === item.id && "opacity-30",
                  )}
                >
                  {renderCard(item)}
                </div>
              ))}

              {/* Место под карточку: без него при перетаскивании в пустую
                  колонку непонятно, попадёт ли она туда вообще. */}
              {active && (
                <div className="border-accent-border text-muted-foreground rounded-xl border-2 border-dashed px-3 py-7 text-center text-xs">
                  Отпустите здесь
                </div>
              )}

              {column.items.length === 0 && !active && (
                <p className="text-muted-foreground px-1.5 py-3 text-xs">Пусто</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
