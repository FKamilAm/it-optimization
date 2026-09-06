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
 * Механика один в один как у `Button` варианта primary: класс `btn-fill`,
 * зелёный слой в `::before`, поднимающийся снизу за 420 мс, и та же кривая
 * `cubic-bezier(0.22, 1, 0.36, 1)`. Совпадать должны не только цвета — глаз
 * ловит именно расхождение в скорости и характере движения, поэтому здесь не
 * своя копия эффекта, а буквально те же утилиты; заодно фильтры бесплатно
 * получают отключение анимации из `prefers-reduced-motion` в `globals.css`,
 * которое написано под `.btn-fill`.
 *
 * Выбранное состояние — собственный фон кнопки, а не тот же поднимающийся слой.
 * Раньше слой был один на оба состояния, и снятие фильтра выглядело так: чёрная
 * заливка перекрашивалась в зелёную и только потом уезжала вниз — вспышка
 * чужого цвета на ровном месте. Теперь наведение и выбор живут на разных слоях
 * и не мешают друг другу: фон под зелёным меняется за 300 мс, а когда курсор
 * уходит, зелёный уезжает и открывает уже готовое состояние.
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
              "btn-fill border-foreground relative inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border px-5 text-sm font-medium md:h-12 md:px-6 md:text-base",
              "before:bg-accent before:absolute before:inset-0 before:z-0",
              "before:translate-y-full before:transition-transform before:duration-[420ms] before:ease-[cubic-bezier(0.22,1,0.36,1)]",
              "hover:text-accent-foreground hover:before:translate-y-0",
              "transition-[color,background-color,border-color,transform] duration-300 ease-out",
              "hover:scale-[1.02] active:scale-[0.99]",
              "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
              "motion-reduce:transform-none motion-reduce:hover:scale-100",
              active ? "bg-foreground text-background" : "text-foreground bg-transparent",
            )}
          >
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
