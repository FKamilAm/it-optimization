"use client";

import { cn } from "@/lib/utils";

export interface FilterChipOption {
  /** `null` — «все», сбрасывает фильтр. */
  value: string | null;
  label: string;
}

/**
 * Строка кнопок-фильтров в фирменном стиле сайта.
 *
 * Заливка сделана отдельным слоем, а не сменой `background-color`: у кнопок
 * сайта (`btn-fill` в `Button`) цвет не переключается, а поднимается снизу, и
 * фильтр должен читаться как та же кнопка. Слой один на оба состояния — при
 * выборе он уже поднят и просто меняет цвет с зелёного на чёрный, поэтому
 * переход из наведения в выбранное состояние выглядит продолжением движения,
 * а не новой анимацией.
 *
 * В отличие от `FilterSelect` на /proekty, здесь именно ряд кнопок: вариантов
 * немного и все они видны сразу, а выпадающий список прячет половину каталога
 * за лишним кликом.
 */
export function FilterChips({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: FilterChipOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Подпись для скринридера — визуально группа не подписана. */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-2 md:gap-3", className)}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value ?? "all"}
            type="button"
            aria-pressed={active}
            data-cursor="dark"
            onClick={() => onChange(option.value)}
            className={cn(
              "group/chip border-foreground relative inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border px-5 text-sm font-medium md:h-12 md:px-6 md:text-base",
              "transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.99]",
              "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
              "motion-reduce:transform-none motion-reduce:hover:scale-100",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 z-0 transition-[transform,background-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                active
                  ? "bg-foreground translate-y-0"
                  : "bg-accent translate-y-full group-hover/chip:translate-y-0",
              )}
            />
            <span
              className={cn(
                "relative z-10 transition-colors duration-300",
                active
                  ? "text-background"
                  : "text-foreground group-hover/chip:text-accent-foreground",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
