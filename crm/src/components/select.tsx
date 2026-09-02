import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Выпадающий список в стиле остального интерфейса.
 *
 * Родной `<select>` рисует список средствами системы: он не подчиняется ни
 * шрифтам, ни цветам, ни скруглениям — и посреди аккуратной формы выглядит
 * чужим. Оформить его нельзя, можно только заменить.
 *
 * Список выводится **порталом в body**, а не рядом с кнопкой. Иначе его
 * обрезало бы модальное окно: у него `overflow-y-auto`, и всё, что вылезает за
 * край, исчезает. Отсюда же закрытие при прокрутке — позиция считается один
 * раз при открытии и за уехавшей кнопкой не следует.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  /**
   * Либо `top`, либо `bottom` — смотря куда открывается список.
   *
   * Вверх он привязывается низом, а не верхом: высота заранее неизвестна
   * (её задаёт число пунктов и max-h), и вычисленный «верх» промахивался бы
   * тем сильнее, чем короче список.
   */
  const [box, setBox] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  function place() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    // Снизу, если там помещается хоть сколько-то; вверх уходим, только когда
    // сверху места заметно больше — иначе список прыгал бы при каждом
    // открытии у нижней трети экрана.
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    const flip = below < 160 && above > below;

    setBox(
      flip
        ? {
            bottom: window.innerHeight - rect.top + 4,
            left: rect.left,
            width: rect.width,
          }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width },
    );
  }

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !list.current?.contains(target)) {
        setOpen(false);
      }
    }
    /**
     * Закрывать нужно, когда прокручивается страница: кнопка уезжает, а список
     * остаётся висеть на месте. Но прокрутка **внутри самого списка** — это
     * ровно то, ради чего он и открыт, и на неё реагировать нельзя. Слушатель
     * стоит в фазе перехвата и ловит вообще любую прокрутку, поэтому свою
     * приходится отсеивать явно.
     */
    function onScroll(event: Event) {
      if (list.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  // Выбранный стрелками пункт подтягивается в видимую часть: иначе на длинном
  // списке подсветка уезжает за край и кажется, что клавиши не работают.
  useEffect(() => {
    if (!open) return;
    const option = list.current?.children[active];
    if (option instanceof HTMLElement) option.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  // Все клавиши обрабатываются на кнопке: фокус никуда не уходит, поэтому
  // список остаётся чисто визуальным и не спорит с формой за фокус.
  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setActive(
          Math.max(
            0,
            options.findIndex((option) => option.value === value),
          ),
        );
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(options.length - 1, current + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setActive(
            Math.max(
              0,
              options.findIndex((option) => option.value === value),
            ),
          );
          setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "border-border bg-background focus:border-accent disabled:bg-disabled disabled:text-muted-foreground flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition outline-none",
          className,
        )}
      >
        <span
          className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}
        >
          {selected?.label ?? "—"}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={cn(
            "text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        box &&
        createPortal(
          <div
            ref={list}
            role="listbox"
            style={{
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              width: box.width,
            }}
            className="border-border bg-background fixed z-[60] max-h-64 overflow-y-auto overscroll-contain rounded-xl border py-1 shadow-lg"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition",
                  index === active && "bg-muted",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check size={14} strokeWidth={2.5} className="text-accent shrink-0" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
