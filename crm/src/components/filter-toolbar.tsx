import { LayoutList, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, Field, Modal, Select } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Панель над списком: фильтры, переключатель вида и поиск.
 *
 * Раскладок две, и они отличаются не размерами, а устройством. На широком
 * экране всё стоит в ряд — места хватает, и лишний клик там ничем не оправдан.
 * На телефоне ряд разваливается на три строки и съедает пол-экрана ещё до
 * первой карточки, поэтому фильтры уезжают за кнопку в окно, а переключатель
 * вида — в выпадающий список: три кнопки «Список / Доска / Календарь» в
 * четверть экрана шириной перестают быть кнопками.
 *
 * Обе раскладки рисуются всегда и скрываются CSS, а не выбираются по
 * `matchMedia`: медиазапрос в JS даёт кадр неправильной раскладки при первой
 * отрисовке и требует слушателя на изменение размера окна.
 *
 * Фильтры приходят списком, а не готовой разметкой, потому что в окне у каждого
 * должна быть подпись, а в ряду она только мешает: «Все» под заголовком «Срез»
 * в строке из четырёх контролов — это шум, а в окне без заголовка «Все» ничего
 * не значит.
 */

export interface ToolbarFilter {
  /** Подпись — показывается только в окне на телефоне. */
  label: string;
  /** `full` — рисовать во всю ширину (окно), иначе компактно (ряд). */
  render: (full: boolean) => ReactNode;
}

export interface ToolbarView {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Подпись для скринридера — визуально переключатель не подписан. */
  ariaLabel: string;
}

export function FilterToolbar({
  filters,
  view,
  search,
  activeCount = 0,
}: {
  filters: ToolbarFilter[];
  view?: ToolbarView;
  search?: ReactNode;
  /**
   * Сколько фильтров отличается от значения по умолчанию. На телефоне сами
   * фильтры не видны, и без числа на кнопке пустой список выглядит поломкой,
   * а не следствием оставленного фильтра.
   */
  activeCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-5 flex flex-col gap-2">
        {/* Широкий экран: всё в один ряд. */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {filters.map((filter) => (
            <div key={filter.label} className="shrink-0">
              {filter.render(false)}
            </div>
          ))}

          {view && (
            <div className="border-border flex shrink-0 overflow-hidden rounded-lg border">
              {view.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => view.onChange(option.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition",
                    view.value === option.value
                      ? "bg-accent-soft text-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {search && <div className="ml-auto">{search}</div>}
        </div>

        {/* Телефон: вид списком, фильтры за кнопкой, поиск отдельной строкой. */}
        <div className="flex items-center gap-2 sm:hidden">
          {view && (
            <Select
              value={view.value}
              onChange={view.onChange}
              ariaLabel={view.ariaLabel}
              icon={<LayoutList size={14} strokeWidth={2} />}
              options={view.options}
              className="min-w-0 flex-1"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(true)}
            className={cn(
              "border-border shrink-0 border",
              !view && "flex-1",
              activeCount > 0 && "border-accent-border bg-accent-soft text-foreground",
            )}
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
            Фильтры
            {activeCount > 0 && ` · ${activeCount}`}
          </Button>
        </div>

        {search && <div className="sm:hidden">{search}</div>}
      </div>

      {open && (
        <Modal title="Фильтры" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            {filters.map((filter) => (
              <Field key={filter.label} label={filter.label}>
                {filter.render(true)}
              </Field>
            ))}
          </div>
          <div className="mt-5">
            <Button type="button" onClick={() => setOpen(false)}>
              Показать
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
