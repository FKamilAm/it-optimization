"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  /** null — «все», без фильтрации. */
  value: string | null;
  label: string;
  count: number;
}

interface FilterSelectProps {
  /** Подпись над кнопкой и одновременно aria-label для списка. */
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

/**
 * Выпадающий фильтр в оформлении сайта. Открывается кликом (не наведением, как
 * меню в шапке): выбор — намеренное действие, и на телефоне наведения нет.
 * Закрывается кликом мимо, Escape и после выбора.
 */
export function FilterSelect({
  label,
  options,
  value,
  onChange,
  className,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
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
  }, [open]);

  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        data-cursor="hover"
        className="border-border/80 hover:border-foreground text-foreground focus-visible:outline-accent inline-flex h-12 cursor-pointer items-center gap-3 rounded-full border bg-transparent pr-5 pl-6 text-base transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-medium">{current?.label}</span>
        <span className="text-muted-foreground tabular-nums">{current?.count}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        role="listbox"
        aria-label={label}
        className={cn(
          "border-border bg-background absolute top-full left-0 z-30 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.14)] transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
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
                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-base transition-colors",
                selected ? "bg-muted text-foreground" : "hover:bg-muted/60",
                option.count === 0 && "text-muted-foreground",
              )}
            >
              <Check
                className={cn("h-4 w-4 shrink-0", !selected && "opacity-0")}
                aria-hidden="true"
              />
              <span className="flex-1">{option.label}</span>
              <span className="text-muted-foreground text-sm tabular-nums">
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
