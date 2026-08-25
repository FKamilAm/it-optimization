"use client";

import { useRef } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  Rocket,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CasesPublishResult } from "@/lib/admin/cases-api";
import { IMAGE_SLOTS, formatBytes, type ImageSlot } from "@/lib/admin/images";

/**
 * Общая обвязка панели: шапка с переключателем разделов, поля формы, плашки
 * публикации. Кейсы и статьи — разный контент с разными правилами, но одна и
 * та же механика «правишь черновик → публикуешь одним действием», и повторять
 * её вёрстку дважды значило бы чинить каждую мелочь дважды.
 *
 * Тексты, как и во всей панели, захардкожены: каталог `messages/ru.json`
 * грузится на каждой публичной странице, а это внутренний инструмент.
 */

export type PanelTab = "cases" | "blog";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "cases", label: "Кейсы" },
  { id: "blog", label: "Блог" },
];

export function PanelHeader({
  title,
  tab,
  onTab,
  loading,
  publishing,
  publishDisabled,
  onRefresh,
  onPublish,
  onLogout,
}: {
  /** Название раздела. Видно только скринридерам — в шапке слева переключатель. */
  title: string;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  loading: boolean;
  publishing: boolean;
  publishDisabled: boolean;
  onRefresh: () => void;
  onPublish: () => void;
  onLogout: () => void;
}) {
  return (
    // z-50: выше выпадающего фильтра (z-40), иначе открытый список накрывает
    // шапку с кнопками публикации.
    <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
        {/* Заголовок остаётся в разметке: страница без h1 — это провал по
            доступности, а показывать его незачем — раздел виден по переключателю. */}
        <h1 className="sr-only">{title}</h1>

        <TabSwitch tab={tab} onTab={onTab} />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || publishing}
            className="border-border hover:border-foreground inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Обновить</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="border-border hover:border-foreground inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishDisabled}
            className="bg-foreground text-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Опубликовать
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Переключатель разделов. Оба раздела живут в памяти одновременно, поэтому
 * переход сюда-обратно не теряет незаконченную правку.
 *
 * Ширина контейнера и половинок задана жёстко, а не по длине надписи: «Кейсы» и
 * «Блог» разной длины, и подвижная вёрстка дёргала бы кнопки шапки при каждом
 * переключении. По той же причине активный раздел подсвечивает не фон кнопки, а
 * отдельная плашка: её можно двигать transform'ом, то есть плавно и без
 * перерасчёта раскладки. Framer Motion с `layoutId` здесь не годится — обе
 * шапки смонтированы разом, и общий layoutId дал бы два «одинаковых» элемента.
 */
function TabSwitch({ tab, onTab }: { tab: PanelTab; onTab: (next: PanelTab) => void }) {
  const active = Math.max(
    0,
    TABS.findIndex((item) => item.id === tab),
  );

  // Не `role="tablist"`: настоящие вкладки обязаны управлять tabpanel'ом и
  // ходить стрелками, а это две кнопки переключения раздела.
  return (
    <div
      role="group"
      aria-label="Раздел панели"
      className="border-border bg-muted/60 relative flex h-10 w-52 shrink-0 rounded-full border p-1"
    >
      <span
        aria-hidden="true"
        style={{ transform: `translateX(${active * 100}%)` }}
        className="bg-background pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      />
      {TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => onTab(item.id)}
          className={cn(
            "relative z-10 flex-1 cursor-pointer rounded-full text-sm transition-colors",
            tab === item.id
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <p className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function PublishNotice({ result }: { result: CasesPublishResult }) {
  return (
    <div
      className={cn(
        "mb-6 rounded-xl border p-4 text-sm",
        result.warning
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-accent-border bg-accent-muted",
      )}
    >
      <p className="flex items-center gap-2 font-medium">
        {result.warning ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {result.warning
          ? "Правки сохранены, но на сайт пока не уехали."
          : "Изменения закоммичены. Сайт пересоберётся сам — обычно 2–4 минуты."}
      </p>
      {result.warning && <p className="mt-2">{result.warning}</p>}
      <p className="text-muted-foreground mt-2 flex flex-wrap gap-4">
        {result.buildUrl && (
          <a
            href={result.buildUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 underline"
          >
            Следить за сборкой <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {result.changeUrl && (
          <a
            href={result.changeUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 underline"
          >
            Коммит {result.version.slice(0, 7)} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </p>
    </div>
  );
}

export function ProblemsNotice({ problems }: { problems: string[] }) {
  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Публикация заблокирована — нужно поправить:</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {problems.slice(0, 8).map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </div>
  );
}

/** Напоминание внизу экрана: правки живут в браузере, пока их не опубликуют. */
export function DirtyDock({
  publishing,
  onPublish,
}: {
  publishing: boolean;
  onPublish: () => void;
}) {
  return (
    <aside
      role="status"
      className="border-border bg-background/95 fixed right-4 bottom-4 left-4 z-40 rounded-2xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.16)] backdrop-blur sm:left-auto sm:w-72"
    >
      <p className="flex items-start gap-2 text-sm font-medium">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Есть неопубликованные изменения
      </p>
      <p className="text-muted-foreground mt-1.5 text-sm">
        Пока не нажмёшь «Опубликовать», на сайте ничего не поменяется.
      </p>
      <button
        type="button"
        onClick={onPublish}
        disabled={publishing}
        className="bg-foreground text-background hover:bg-accent hover:text-accent-foreground mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
      >
        {publishing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        Опубликовать
      </button>
    </aside>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  className?: string;
}) {
  const shared =
    "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
  return (
    <label className={cn("block text-sm", className)}>
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(shared, "resize-y")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
      {hint && <span className="text-muted-foreground mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

/** Соотношение сторон превью — по геометрии слота, а не по списку исключений. */
function aspectStyle(slot: ImageSlot): string {
  const spec = IMAGE_SLOTS[slot];
  return `${spec.width} / ${spec.height}`;
}

export function ImageDrop({
  slot,
  preview,
  pendingBytes,
  onPick,
}: {
  slot: ImageSlot;
  /** Что показать: локальное превью или уже опубликованный путь. */
  preview: string;
  /** Размер только что обработанного файла — null, если новый не выбирали. */
  pendingBytes: number | null;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const spec = IMAGE_SLOTS[slot];

  return (
    <div className="border-border bg-background rounded-xl border p-3 text-sm">
      <p className="font-medium">{spec.label}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{spec.hint}</p>

      <div
        className="bg-muted mt-3 overflow-hidden rounded-lg"
        style={{ aspectRatio: aspectStyle(slot) }}
      >
        {preview ? (
          // Local previews and repo paths alike — plain <img>, no optimizer here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-muted-foreground flex h-full items-center justify-center text-xs">
            пусто
          </span>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="border-border hover:border-foreground mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full border text-xs font-medium transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        {preview ? "Заменить" : "Загрузить"}
      </button>
      {pendingBytes !== null && (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          новая · {spec.width}×{spec.height} · {formatBytes(pendingBytes)}
        </p>
      )}
    </div>
  );
}
