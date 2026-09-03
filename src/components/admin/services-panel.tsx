"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceCatalogEntry, ServiceCategoryRecord } from "@/lib/services/types";
import type { ServicesApi, ServicesPublishResult } from "@/lib/admin/services-api";
import { SERVICE_TITLES } from "@/lib/admin/content-meta";
import {
  DirtyDock,
  ErrorNotice,
  PanelHeader,
  PanelSelect,
  ProblemsNotice,
  PublishNotice,
  type PanelTab,
} from "./panel-chrome";

/**
 * Раздел «Услуги»: разделы каталога и то, в каком из них стоит услуга.
 *
 * Тексты страниц здесь не правятся — они в `content/services.json`, и их
 * двенадцать полей на тридцать две страницы. Панель управляет структурой:
 * какие есть разделы, в каком они порядке, где стоит услуга и опубликована ли
 * она. Этого хватает, чтобы перекроить каталог на сайте, не трогая код.
 *
 * Порядок услуг внутри раздела и есть порядок карточек на /uslugi/ и пунктов в
 * меню сайта, поэтому список показан сгруппированным: иначе непонятно, что
 * именно двигают стрелки.
 *
 * Тексты, как и во всей панели, захардкожены: каталог `messages/ru.json`
 * грузится на каждой публичной странице, а это внутренний инструмент.
 */

/** «1 услуга», «2 услуги», «5 услуг»: счётчик без согласования читается как машинный. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/**
 * Пара стрелок «выше/ниже».
 *
 * Вынесена, потому что нужна и разделам, и услугам, а зона нажатия у голой
 * иконки в 16 пикселей — это промах через раз.
 */
function MoveButtons({
  onUp,
  onDown,
  upDisabled,
  downDisabled,
}: {
  onUp: () => void;
  onDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}) {
  const style =
    "text-muted-foreground hover:bg-muted hover:text-foreground flex h-5 w-7 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <button
        type="button"
        aria-label="Выше"
        disabled={upDisabled}
        onClick={onUp}
        className={style}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Ниже"
        disabled={downDisabled}
        onClick={onDown}
        className={style}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

interface DraftCategory extends ServiceCategoryRecord {
  /** True, пока раздел не публиковался: ключ ещё подстраивается под название. */
  isNew: boolean;
}

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/**
 * Ключ раздела из его названия: латиница в camelCase.
 *
 * Не `slugify()` из content-meta: тот делает адрес через дефисы, а ключ раздела
 * — идентификатор, и сервер требует `^[a-zA-Z][a-zA-Z0-9]*$`. Дефис в нём
 * развалил бы валидацию уже на первом сохранении.
 */
function categoryKey(title: string): string {
  const words = Array.from(title.toLowerCase())
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "";
  const [first, ...rest] = words;
  const key = first + rest.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  return /^[a-z]/.test(key) ? key.slice(0, 40) : `r${key}`.slice(0, 40);
}

function uniqueKey(base: string, taken: readonly string[]): string {
  const seed = base || "razdel";
  if (!taken.includes(seed)) return seed;
  for (let i = 2; ; i += 1) {
    const candidate = `${seed}${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

/** Услуги одного раздела в порядке каталога. */
function inCategory(services: ServiceCatalogEntry[], key: string): ServiceCatalogEntry[] {
  return services.filter((service) => service.category === key);
}

function validate(
  categories: DraftCategory[],
  services: ServiceCatalogEntry[],
): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();

  for (const category of categories) {
    if (!category.title.trim()) {
      problems.push("У раздела не заполнено название");
    }
    if (!category.key) {
      problems.push(`Раздел «${category.title}»: не получился ключ из названия`);
    } else if (keys.has(category.key)) {
      problems.push(`Ключ раздела «${category.key}» повторяется`);
    }
    keys.add(category.key);
  }

  if (!categories.length) problems.push("Нужен хотя бы один раздел");

  for (const service of services) {
    if (!keys.has(service.category)) {
      problems.push(
        `Услуга «${SERVICE_TITLES.get(service.key) ?? service.key}» осталась без раздела`,
      );
    }
  }

  return Array.from(new Set(problems));
}

export function ServicesPanel({
  api,
  tab,
  onTab,
  onLogout,
  userEmail,
}: {
  api: ServicesApi;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onLogout: () => void;
  userEmail: string | null;
}) {
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [services, setServices] = useState<ServiceCatalogEntry[]>([]);
  const [baseline, setBaseline] = useState("");
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<ServicesPublishResult | null>(null);

  const load = useCallback(async (source: ServicesApi) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await source.load();
      const loaded = snapshot.categories.map((category) => ({
        ...category,
        isNew: false,
      }));
      setCategories(loaded);
      setServices(snapshot.services);
      setBaseline(
        JSON.stringify({ categories: snapshot.categories, services: snapshot.services }),
      );
      setVersion(snapshot.version);
      setPublished(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(api);
  }, [api, load]);

  const snapshot = useMemo(
    () => ({
      categories: categories.map(({ key, title }) => ({ key, title })),
      services,
    }),
    [categories, services],
  );
  const problems = useMemo(() => validate(categories, services), [categories, services]);
  const dirty = JSON.stringify(snapshot) !== baseline;
  const draftCount = services.filter((service) => service.draft).length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const renameCategory = (key: string, title: string) =>
    setCategories((list) => {
      const taken = list.filter((item) => item.key !== key).map((item) => item.key);
      return list.map((item) => {
        if (item.key !== key) return item;
        // Ключ следует за названием только у нового раздела: у сохранённого на
        // него уже ссылаются услуги, и смена ключа осиротила бы их.
        if (!item.isNew) return { ...item, title };
        const nextKey = uniqueKey(categoryKey(title), taken);
        setServices((all) =>
          all.map((service) =>
            service.category === item.key ? { ...service, category: nextKey } : service,
          ),
        );
        return { ...item, title, key: nextKey };
      });
    });

  const moveCategory = (index: number, delta: number) =>
    setCategories((list) => {
      const next = index + delta;
      if (next < 0 || next >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });

  const addCategory = () =>
    setCategories((list) => [
      ...list,
      {
        key: uniqueKey(
          "razdel",
          list.map((item) => item.key),
        ),
        title: "",
        isNew: true,
      },
    ]);

  const removeCategory = (key: string) =>
    setCategories((list) => list.filter((item) => item.key !== key));

  /**
   * Перенос услуги в другой раздел: запись встаёт в конец нового раздела.
   *
   * Порядок в плоском списке — это и есть порядок на сайте, поэтому услугу
   * нужно не просто пометить, а физически переставить: иначе она осталась бы
   * стоять посреди чужой группы и стрелки «вверх/вниз» вели бы себя странно.
   */
  const setCategoryOf = (key: string, category: string) =>
    setServices((list) => {
      const moved = list.find((service) => service.key === key);
      if (!moved || moved.category === category) return list;
      const rest = list.filter((service) => service.key !== key);
      const lastIndex = rest.map((service) => service.category).lastIndexOf(category);
      const at = lastIndex === -1 ? rest.length : lastIndex + 1;
      return [...rest.slice(0, at), { ...moved, category }, ...rest.slice(at)];
    });

  const toggleDraft = (key: string) =>
    setServices((list) =>
      list.map((service) =>
        service.key === key ? { ...service, draft: !service.draft } : service,
      ),
    );

  /** Сдвиг внутри своего раздела: меняемся местами с соседом той же группы. */
  const moveService = (key: string, delta: number) =>
    setServices((list) => {
      const index = list.findIndex((service) => service.key === key);
      if (index === -1) return list;
      const category = list[index].category;
      const step = delta > 0 ? 1 : -1;
      for (let i = index + step; i >= 0 && i < list.length; i += step) {
        if (list[i].category !== category) continue;
        const copy = [...list];
        [copy[index], copy[i]] = [copy[i], copy[index]];
        return copy;
      }
      return list;
    });

  const publish = async () => {
    if (!version || problems.length) return;
    setPublishing(true);
    setError(null);
    try {
      const result = await api.publish({ ...snapshot, baseVersion: version });
      setVersion(result.version);
      setBaseline(JSON.stringify(snapshot));
      setCategories((list) => list.map((item) => ({ ...item, isNew: false })));
      setPublished(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPublishing(false);
    }
  };

  /**
   * Порядок показа разделов: новые сверху, сохранённые — как лежат в каталоге.
   *
   * В самом массиве новый раздел стоит последним (там он и окажется на сайте),
   * поэтому вместе с записью носим её настоящий индекс: стрелки двигают
   * каталог, а не строчку на экране.
   */
  const ordered = useMemo(() => {
    const withIndex = categories.map((category, index) => ({ category, index }));
    return [
      ...withIndex.filter((item) => item.category.isNew),
      ...withIndex.filter((item) => !item.category.isNew),
    ];
  }, [categories]);

  const categoryOptions = categories.map((category) => ({
    value: category.key,
    label: category.title || category.key,
  }));

  return (
    <div className="bg-muted/40 min-h-screen pb-32">
      <PanelHeader
        title="Услуги"
        tab={tab}
        onTab={onTab}
        loading={loading}
        publishing={publishing}
        publishDisabled={!dirty || publishing || problems.length > 0}
        onRefresh={() => void load(api)}
        onPublish={() => void publish()}
        onLogout={onLogout}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
        <p className="text-muted-foreground mb-5 text-sm">
          {services.length} {plural(services.length, "услуга", "услуги", "услуг")} ·{" "}
          {categories.length} {plural(categories.length, "раздел", "раздела", "разделов")}{" "}
          · {draftCount} {plural(draftCount, "черновик", "черновика", "черновиков")}
          {userEmail && ` · ${userEmail}`}
        </p>

        {error && <ErrorNotice message={error} />}
        {published && !dirty && <PublishNotice result={published} />}
        {dirty && problems.length > 0 && <ProblemsNotice problems={problems} />}

        {loading && !categories.length ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загружаю {api.sourceLabel}…
          </p>
        ) : (
          <>
            <section className="border-border bg-background rounded-2xl border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg">Разделы каталога</h2>
                <button
                  type="button"
                  onClick={addCategory}
                  className="border-border hover:border-foreground inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить раздел
                </button>
              </div>

              {/* Новый раздел показывается первым, а встаёт последним.
                  Поле сверху — чтобы не искать его в конце длинного списка;
                  позиция в конце — чтобы добавление не перетасовывало кнопки
                  фильтра на сайте у всех, кто уже привык к их порядку. */}
              <ul className="mt-4 space-y-2">
                {ordered.map(({ category, index }) => {
                  const used = inCategory(services, category.key).length;
                  return (
                    <li
                      key={category.key}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-2.5",
                        category.isNew
                          ? "border-accent-border bg-accent-muted"
                          : "border-border bg-muted/30",
                      )}
                    >
                      {category.isNew ? (
                        <span
                          aria-hidden="true"
                          className="text-muted-foreground/60 w-7 text-center text-lg leading-none"
                        >
                          +
                        </span>
                      ) : (
                        <MoveButtons
                          upDisabled={index === 0}
                          downDisabled={index === categories.length - 1}
                          onUp={() => moveCategory(index, -1)}
                          onDown={() => moveCategory(index, 1)}
                        />
                      )}

                      <input
                        type="text"
                        value={category.title}
                        placeholder="Название раздела"
                        onChange={(event) =>
                          renameCategory(category.key, event.target.value)
                        }
                        className="border-border bg-background focus:border-foreground h-9 min-w-0 rounded-lg border px-3 text-sm transition-colors outline-none"
                      />

                      {/* Ключ и счётчик — колонки фиксированной ширины: иначе
                          каждое поле ввода получает свою длину, и столбец
                          рассыпается лесенкой. */}
                      <div className="flex shrink-0 items-center gap-3">
                        <code className="text-muted-foreground hidden w-28 truncate text-right text-xs sm:block">
                          {category.key}
                        </code>
                        <span className="text-muted-foreground w-24 text-right text-xs tabular-nums">
                          {category.isNew
                            ? "встанет последним"
                            : `${used} ${plural(used, "услуга", "услуги", "услуг")}`}
                        </span>
                        <button
                          type="button"
                          aria-label="Удалить раздел"
                          title={
                            used
                              ? "Сначала перенесите услуги в другой раздел"
                              : "Удалить раздел"
                          }
                          disabled={used > 0}
                          onClick={() => removeCategory(category.key)}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-6 space-y-6">
              {categories.map((category) => {
                const list = inCategory(services, category.key);
                return (
                  <div
                    key={category.key}
                    className="border-border bg-background rounded-2xl border p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-display text-lg">
                        {category.title || category.key}
                      </h2>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {list.length} {plural(list.length, "услуга", "услуги", "услуг")}
                      </span>
                    </div>

                    {list.length === 0 ? (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Пока пусто — перенесите сюда услуги из других разделов.
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-2">
                        {list.map((service, index) => (
                          <li
                            key={service.key}
                            className={cn(
                              "border-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-2.5",
                              service.draft ? "bg-amber-50/60" : "bg-muted/30",
                            )}
                          >
                            <MoveButtons
                              upDisabled={index === 0}
                              downDisabled={index === list.length - 1}
                              onUp={() => moveService(service.key, -1)}
                              onDown={() => moveService(service.key, 1)}
                            />

                            <div className="min-w-0 flex-1 basis-48">
                              <p className="truncate text-sm font-medium">
                                {SERVICE_TITLES.get(service.key) ?? service.key}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                /uslugi/{service.slug}/
                              </p>
                            </div>

                            {/* Два состояния одной кнопкой, а не галочка: в
                                плотной строке подпись «Черновик» с пустым
                                квадратиком не отвечает на вопрос, что сейчас
                                на сайте. */}
                            <button
                              type="button"
                              aria-pressed={service.draft}
                              onClick={() => toggleDraft(service.key)}
                              title={
                                service.draft
                                  ? "Страница не показывается в каталоге и закрыта от индексации"
                                  : "Страница опубликована"
                              }
                              className={cn(
                                "h-9 w-28 shrink-0 cursor-pointer rounded-full border text-xs font-medium transition-colors",
                                service.draft
                                  ? "border-amber-300 bg-amber-100/70 text-amber-900 hover:bg-amber-100"
                                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                              )}
                            >
                              {service.draft ? "Черновик" : "На сайте"}
                            </button>

                            <PanelSelect
                              label="Раздел"
                              options={categoryOptions}
                              value={service.category}
                              onChange={(next) => setCategoryOf(service.key, next)}
                              className="w-full shrink-0 sm:w-60"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>

            <p className="text-muted-foreground mt-6 text-xs">
              Страницы услуг и их тексты правятся в репозитории (content/services.json).
              Здесь — только структура каталога: разделы, порядок и черновики. Источник:{" "}
              {api.sourceLabel}.
            </p>
          </>
        )}
      </main>

      {dirty && problems.length === 0 && (
        <DirtyDock publishing={publishing} onPublish={() => void publish()} />
      )}
    </div>
  );
}
