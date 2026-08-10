import { cn } from "@/lib/cn";

/**
 * Инициалы кружком вместо аватарки.
 *
 * Фотографий у нас нет и не будет: разработчики значатся именами, а не
 * учётными записями. Кружок с буквой читается на карточке быстрее строки
 * «Егор, Вадим» и занимает меньше места.
 *
 * Цвет выводится из самого имени, а не хранится: у одного человека он всегда
 * один и тот же, а новое имя не требует ни поля в базе, ни правки палитры.
 */
const PALETTE = [
  "bg-[#e8f0d6] text-[#4a5d1f]",
  "bg-[#dce7f5] text-[#274668]",
  "bg-[#f5e2dc] text-[#6b3323]",
  "bg-[#e6e0f2] text-[#41316b]",
  "bg-[#fdeecd] text-[#6b4c14]",
  "bg-[#d9efe8] text-[#1f5148]",
] as const;

function paletteFor(name: string): string {
  // Сумма кодов символов: устойчиво к регистру ввода не нужно — имена приходят
  // из закрытого списка, а разброс на шести цветах достаточный.
  let sum = 0;
  for (const char of name) sum += char.codePointAt(0) ?? 0;
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0];
}

export function PersonChip({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        paletteFor(name),
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Несколько человек подряд, внахлёст — как список участников в трекерах. */
export function PersonChips({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <span className="flex -space-x-1.5">
      {names.map((name) => (
        <PersonChip key={name} name={name} className="ring-background ring-2" />
      ))}
    </span>
  );
}
