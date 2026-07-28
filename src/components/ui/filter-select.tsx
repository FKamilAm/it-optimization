"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  /** null — «все», без фильтрации. */
  value: string | null;
  label: string;
  count: number;
}

/** Общая обвязка выпадашки: кнопка, панель, закрытие по клику мимо и Escape. */
function Dropdown({
  trigger,
  children,
  open,
  setOpen,
  className,
  panelClassName,
}: {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
  panelClassName?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    // z-40 нужен здесь, а не только на панели: карточки ниже по разметке лежат
    // в своём слое, и без этого открытый список уезжает под них.
    <div ref={rootRef} className={cn("relative z-40 inline-block", className)}>
      {trigger(open)}
      <div
        className={cn(
          "border-border bg-background absolute top-full left-0 z-50 mt-2 max-h-[22rem] overflow-y-auto rounded-2xl border p-2 shadow-[0_28px_70px_rgba(0,0,0,0.16)] transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

const TRIGGER =
  "border-border/80 hover:border-foreground text-foreground focus-visible:outline-accent flex h-14 w-full cursor-pointer items-center gap-3 rounded-full border bg-transparent pr-6 pl-7 text-base transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2";

const ROW =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left text-base transition-colors";

/** Выбор одной категории. */
export function FilterSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <Dropdown
      open={open}
      setOpen={setOpen}
      className={cn("w-full max-w-md", className)}
      panelClassName="w-full"
      trigger={(isOpen) => (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          data-cursor="hover"
          className={TRIGGER}
        >
          <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
          <span className="flex-1 truncate text-left font-medium">{current?.label}</span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            {current?.count}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-300",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      )}
    >
      <div role="listbox" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value ?? "all"}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                ROW,
                selected ? "bg-muted text-foreground" : "hover:bg-muted/60",
                option.count === 0 && !selected && "text-muted-foreground",
              )}
            >
              <Check
                className={cn("h-4 w-4 shrink-0", !selected && "opacity-0")}
                aria-hidden="true"
              />
              <span className="flex-1">{option.label}</span>
              <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
}

/**
 * Выбор нескольких категорий. Выбранное показывается плашками рядом со списком,
 * каждую можно снять крестиком — по одному взгляду видно, что уже отмечено, без
 * необходимости открывать выпадашку.
 */
export function MultiFilterSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const byValue = new Map(options.map((option) => [option.value, option.label]));

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );

  return (
    <div className={cn("flex flex-wrap items-start gap-3", className)}>
      <Dropdown
        open={open}
        setOpen={setOpen}
        className="w-full sm:w-72"
        panelClassName="w-full"
        trigger={(isOpen) => (
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setOpen(!isOpen)}
            className={cn(TRIGGER, "h-12 pr-4 pl-5")}
          >
            <span className="flex-1 truncate text-left">
              {selected.length ? `Выбрано: ${selected.length}` : placeholder}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        )}
      >
        <div role="listbox" aria-label={label} aria-multiselectable="true">
          {options.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => toggle(option.value)}
                className={cn(ROW, on ? "bg-muted text-foreground" : "hover:bg-muted/60")}
              >
                <Check
                  className={cn("h-4 w-4 shrink-0", !on && "opacity-0")}
                  aria-hidden="true"
                />
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      </Dropdown>

      {selected.length > 0 && (
        <ul className="flex flex-1 flex-wrap gap-2 pt-1">
          {selected.map((value) => (
            <li key={value}>
              <span className="border-accent-border bg-accent-soft inline-flex items-center gap-1.5 rounded-full border py-1.5 pr-2 pl-3 text-sm">
                {byValue.get(value) ?? value}
                <button
                  type="button"
                  onClick={() => toggle(value)}
                  aria-label={`Убрать «${byValue.get(value) ?? value}»`}
                  className="hover:bg-foreground/10 cursor-pointer rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
