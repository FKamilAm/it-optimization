"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FilterSelect,
  MultiFilterSelect,
  type FilterOption,
} from "@/components/ui/filter-select";
import { countCasesByService, formatTags, type CaseItem } from "@/lib/cases";
import { ADMIN_REPO, CASES_JSON_PATH } from "@/lib/admin/github";
import type { CasesApi, CasesPublishResult } from "@/lib/admin/cases-api";
import { ADMIN_MODE } from "@/lib/admin/auth";
import {
  CASES_REPO_DIR,
  assetPaths,
  processImage,
  type CaseImageSlot,
  type ProcessedImage,
} from "@/lib/admin/images";
import {
  HOME_CASE_COUNT,
  SERVICE_OPTIONS,
  serviceTitles,
  slugify,
  uniqueSlug,
} from "@/lib/admin/content-meta";
import {
  DirtyDock,
  ErrorNotice,
  Field,
  ImageDrop,
  PanelHeader,
  ProblemsNotice,
  PublishNotice,
  type PanelTab,
} from "./panel-chrome";

/**
 * Раздел «Кейсы»: список портфолио, порядок на сайте и картинки.
 *
 * Copy here is intentionally hardcoded rather than added to `messages/ru.json`:
 * the catalog is loaded on every public page, and this is an internal tool, not
 * site copy.
 */

interface DraftCase extends CaseItem {
  /**
   * Устойчивая identity для React. У нового кейса slug переписывается на каждом
   * нажатии в поле заголовка, поэтому slug не годится ключом списка: строка
   * перемонтировалась бы и теряла фокус посреди набора.
   */
  draftId: string;
  /** Теги правятся одной строкой, а хранятся списком — см. parseTags. */
  tagsDraft: string;
  /** Картинки, обработанные в браузере, но ещё не отправленные. */
  pending: Partial<Record<CaseImageSlot, ProcessedImage>>;
  /** True, пока кейс ни разу не публиковался (slug ещё подстраивается). */
  isNew?: boolean;
}

const SLOT_ORDER: CaseImageSlot[] = ["cover", "detail", "detailMobile"];

const EMPTY_CASE: Omit<CaseItem, "id" | "slug" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  quote: "",
  tags: [],
  services: [],
  cover: "",
  detail: "",
  detailMobile: "",
};

/** Строка из поля «Теги» → список, как в базе. Разделитель принимаем любой привычный. */
function parseTags(input: string): string[] {
  return input
    .split(/[•·,;|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDrafts(items: CaseItem[]): DraftCase[] {
  return items.map((item) => ({
    ...item,
    draftId: crypto.randomUUID(),
    tagsDraft: formatTags(item.tags),
    pending: {},
  }));
}

/**
 * Final public path of one slot. Asset filenames embed the case key, and a new
 * case renames itself while its title is typed, so paths are derived from the
 * *current* key rather than frozen when the image was processed.
 */
function slotPath(draft: DraftCase, slot: CaseImageSlot): string {
  const pending = draft.pending[slot];
  return pending ? assetPaths(slot, draft.slug, pending.hash).path : draft[slot];
}

/** cases.json as it will be committed — pending image paths applied, drafts stripped. */
function serialize(drafts: DraftCase[]): CaseItem[] {
  return drafts.map((draft) => {
    const detail = slotPath(draft, "detail");
    return {
      id: draft.id,
      slug: draft.slug,
      title: draft.title.trim(),
      description: draft.description.trim(),
      quote: draft.quote.trim(),
      tags: parseTags(draft.tagsDraft),
      services: draft.services,
      cover: slotPath(draft, "cover"),
      detail,
      // Вертикальный слайд необязателен — если его нет, берём широкий.
      detailMobile: slotPath(draft, "detailMobile") || detail,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  });
}

function currentImage(draft: DraftCase, slot: CaseImageSlot): string {
  return draft.pending[slot]?.previewUrl || draft[slot] || "";
}

function validate(drafts: DraftCase[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  drafts.forEach((draft, index) => {
    const label = draft.title.trim() || `кейс №${index + 1}`;
    if (!draft.slug) problems.push(`«${label}»: пустой адрес (slug)`);
    if (seen.has(draft.slug)) problems.push(`Адрес «${draft.slug}» повторяется`);
    seen.add(draft.slug);

    if (!draft.title.trim()) problems.push(`Кейс №${index + 1}: не заполнен заголовок`);
    if (!draft.description.trim()) problems.push(`«${label}»: не заполнено описание`);
    if (!draft.quote.trim()) problems.push(`«${label}»: не заполнена цитата`);
    if (!parseTags(draft.tagsDraft).length)
      problems.push(`«${label}»: не заполнены теги`);
    if (!currentImage(draft, "cover")) problems.push(`«${label}»: нет обложки`);
    if (!currentImage(draft, "detail"))
      problems.push(`«${label}»: нет слайда для лайтбокса`);
  });

  return problems;
}

export function CasesPanel({
  api,
  tab,
  onTab,
  onLogout,
  userEmail,
}: {
  api: CasesApi;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onLogout: () => void;
  userEmail?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftCase[]>([]);
  const [baseline, setBaseline] = useState<CaseItem[]>([]);
  /** Версия данных, на которой открыта панель, — уезжает обратно при публикации. */
  const [version, setVersion] = useState<string | null>(null);
  /** Asset paths dropped by a delete/replace — cleaned up at publish time. */
  const [orphaned, setOrphaned] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  /** Какая услуга выбрана в фильтре; null — показываем все кейсы. */
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<CasesPublishResult | null>(null);

  const load = useCallback(async (activeApi: CasesApi) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await activeApi.load();
      const loaded = toDrafts(snapshot.cases);
      setDrafts(loaded);
      // Через serialize(), чтобы проверка «есть ли правки» сравнивала одинаковое.
      setBaseline(serialize(loaded));
      setVersion(snapshot.version);
      setOrphaned([]);
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

  const serialized = useMemo(() => serialize(drafts), [drafts]);
  /** Счётчики берём из сериализованных кейсов, чтобы они шли за правками. */
  const serviceCounts = useMemo(() => countCasesByService(serialized), [serialized]);
  const visibleDrafts = useMemo(
    () =>
      serviceFilter
        ? drafts.filter((draft) => draft.services.includes(serviceFilter))
        : drafts,
    [drafts, serviceFilter],
  );
  /** Ещё не опубликованные — их карточки выносим наверх списка. */
  const newDrafts = useMemo(
    () => visibleDrafts.filter((draft) => draft.isNew),
    [visibleDrafts],
  );
  const savedDrafts = useMemo(
    () => visibleDrafts.filter((draft) => !draft.isNew),
    [visibleDrafts],
  );
  const problems = useMemo(() => validate(drafts), [drafts]);
  const pendingImageCount = useMemo(
    () => drafts.reduce((sum, draft) => sum + Object.keys(draft.pending).length, 0),
    [drafts],
  );
  const dirty =
    JSON.stringify(serialized) !== JSON.stringify(baseline) || pendingImageCount > 0;

  // Guard against closing the tab with unpublished edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (draftId: string, changes: Partial<DraftCase>) =>
    setDrafts((list) =>
      list.map((draft) => (draft.draftId === draftId ? { ...draft, ...changes } : draft)),
    );

  const addCase = () => {
    const slug = uniqueSlug(
      "novyy-keys",
      drafts.map((draft) => draft.slug),
    );
    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();
    setDrafts((list) => [
      ...list,
      {
        // id живёт вечно и переживает переименование slug — как в таблице cases.
        id: crypto.randomUUID(),
        slug,
        draftId,
        tagsDraft: "",
        ...EMPTY_CASE,
        // Если открыт фильтр по услуге, логично сразу привязать к ней.
        services: serviceFilter ? [serviceFilter] : [],
        createdAt: now,
        updatedAt: now,
        pending: {},
        isNew: true,
      },
    ]);
    setOpenId(draftId);
    setPublished(null);
  };

  const removeCase = (draftId: string) => {
    const draft = drafts.find((item) => item.draftId === draftId);
    if (!draft) return;
    const used = serviceTitles(draft.services);
    const warning = used.length
      ? `\n\nЭтот кейс показывается на страницах услуг: ${used.join(", ")}. После удаления там станет на один кейс меньше.`
      : "";
    if (!window.confirm(`Удалить кейс «${draft.title || draft.slug}»?${warning}`)) return;

    // Remember the artwork so the publish commit can delete the files too.
    setOrphaned((list) => [
      ...list,
      ...SLOT_ORDER.map((slot) => draft[slot]).filter(Boolean),
    ]);
    Object.values(draft.pending).forEach((image) =>
      URL.revokeObjectURL(image.previewUrl),
    );
    setDrafts((list) => list.filter((item) => item.draftId !== draftId));
    if (openId === draftId) setOpenId(null);
  };

  const attachImage = async (draftId: string, slot: CaseImageSlot, file: File) => {
    setError(null);
    const draft = drafts.find((item) => item.draftId === draftId);
    if (!draft) return;
    try {
      const processed = await processImage(file, slot);
      const previous = draft.pending[slot];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      // The old committed asset becomes garbage once this one replaces it.
      if (draft[slot]) setOrphaned((list) => [...list, draft[slot]]);
      patch(draftId, { pending: { ...draft.pending, [slot]: processed } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const publish = async () => {
    if (!version || problems.length) return;
    setPublishing(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      // updatedAt двигаем только у реально изменившихся кейсов, иначе каждая
      // публикация помечала бы «изменённым» весь список.
      const nextCases = serialize(drafts).map((item) => {
        const before = baseline.find((previous) => previous.id === item.id);
        const same =
          before &&
          JSON.stringify({ ...before, updatedAt: "" }) ===
            JSON.stringify({ ...item, updatedAt: "" });
        return same ? item : { ...item, updatedAt: now };
      });
      const referenced = new Set(
        nextCases.flatMap((item) => [item.cover, item.detail, item.detailMobile]),
      );
      // Only delete assets nothing points at any more, and only our own folder.
      const deletions = Array.from(new Set(orphaned))
        .filter((path) => path.startsWith("/cases/") && !referenced.has(path))
        .map((path) => `public${path}`);

      const uploads = drafts.flatMap((draft) =>
        SLOT_ORDER.flatMap((slot) => {
          const image = draft.pending[slot];
          return image
            ? [
                {
                  caseId: draft.id,
                  slot,
                  path: assetPaths(slot, draft.slug, image.hash).repoPath,
                  blob: image.blob,
                },
              ]
            : [];
        }),
      );

      const added = nextCases.length - baseline.length;
      const summary = [
        added > 0 ? `+${added}` : added < 0 ? `${added}` : null,
        pendingImageCount ? `${pendingImageCount} img` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const result = await api.publish({
        cases: nextCases,
        uploads,
        deletions,
        baseVersion: version,
        summary,
      });

      // Превью уже уехали — освобождаем blob-URL до очистки состояния
      // (вне state-updater: в dev React может вызвать его дважды).
      drafts.forEach((draft) =>
        Object.values(draft.pending).forEach((image) =>
          URL.revokeObjectURL(image.previewUrl),
        ),
      );

      setPublished(result);
      setBaseline(nextCases);
      setVersion(result.version);
      setOrphaned([]);
      setDrafts((list) =>
        list.map((draft) => {
          const saved = nextCases.find((item) => item.id === draft.id);
          return {
            ...draft,
            ...saved,
            draftId: draft.draftId,
            tagsDraft: draft.tagsDraft,
            pending: {},
            isNew: false,
          };
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-muted/40 min-h-screen pb-32">
      <PanelHeader
        title="Кейсы"
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
        {/* Раньше эта строка была подписью в шапке; там теперь переключатель. */}
        <p className="text-muted-foreground mb-5 text-sm">
          {drafts.length} шт. · первые {HOME_CASE_COUNT} видны на главной
          {userEmail && ` · ${userEmail}`}
        </p>

        {error && <ErrorNotice message={error} />}
        {published && !dirty && <PublishNotice result={published} />}
        {dirty && problems.length > 0 && <ProblemsNotice problems={problems} />}

        {loading && drafts.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загружаю {api.sourceLabel}…
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <ServiceFilter
                counts={serviceCounts}
                total={drafts.length}
                active={serviceFilter}
                onChange={setServiceFilter}
              />
              <button
                type="button"
                onClick={addCase}
                className="border-foreground/40 hover:border-foreground hover:bg-background ml-auto inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-dashed px-6 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Добавить кейс
              </button>
            </div>

            {serviceFilter && (
              <p className="text-muted-foreground mb-3 text-sm">
                Показаны кейсы одной услуги — {visibleDrafts.length} из {drafts.length}.
                Перетаскивание доступно только без фильтра: порядок общий для всего сайта.
              </p>
            )}

            {/* Ещё не опубликованные кейсы показываем сверху, чтобы форма
                открывалась под кнопкой, а не за два десятка карточек ниже.
                В самом списке они остаются последними — порядок на сайте от
                этого не меняется. */}
            {newDrafts.length > 0 && (
              // Собственная Reorder.Group, а не просто div: карточка кейса —
              // это Reorder.Item, и вне группы он падает с ошибкой. Порядок
              // здесь не меняют, поэтому onReorder ничего не делает.
              <Reorder.Group
                axis="y"
                values={newDrafts}
                onReorder={() => {}}
                className="mb-3 space-y-3"
              >
                {newDrafts.map((draft) => (
                  <CaseRow
                    key={draft.draftId}
                    draft={draft}
                    index={drafts.indexOf(draft)}
                    open={openId === draft.draftId}
                    draggable={false}
                    onToggle={() =>
                      setOpenId(openId === draft.draftId ? null : draft.draftId)
                    }
                    onChange={(changes) => patch(draft.draftId, changes)}
                    onRename={(slug) => patch(draft.draftId, { slug })}
                    takenSlugs={drafts.map((item) => item.slug)}
                    onDelete={() => removeCase(draft.draftId)}
                    onImage={(slot, file) => void attachImage(draft.draftId, slot, file)}
                  />
                ))}
              </Reorder.Group>
            )}

            <Reorder.Group
              axis="y"
              values={savedDrafts}
              onReorder={(next) =>
                // Новые кейсы не участвуют в перетаскивании и всегда идут в
                // хвосте, поэтому дописываем их обратно после переупорядоченных.
                setDrafts([...next, ...drafts.filter((item) => item.isNew)])
              }
              className="space-y-3"
            >
              {savedDrafts.map((draft) => {
                const index = drafts.indexOf(draft);
                return (
                  <CaseRow
                    key={draft.draftId}
                    draft={draft}
                    index={index}
                    open={openId === draft.draftId}
                    draggable={!serviceFilter}
                    onToggle={() =>
                      setOpenId(openId === draft.draftId ? null : draft.draftId)
                    }
                    onChange={(changes) => patch(draft.draftId, changes)}
                    onRename={(slug) => patch(draft.draftId, { slug })}
                    takenSlugs={drafts.map((item) => item.slug)}
                    onDelete={() => removeCase(draft.draftId)}
                    onImage={(slot, file) => void attachImage(draft.draftId, slot, file)}
                  />
                );
              })}
            </Reorder.Group>
          </>
        )}

        <p className="text-muted-foreground mt-10 text-xs leading-relaxed">
          {ADMIN_MODE === "api" ? (
            <>
              Правки сохраняются в базу сразу, а «Опубликовать» отправляет снапшот в
              репозиторий — дальше GitHub Actions собирает сайт и заливает его на хостинг.
            </>
          ) : (
            <>
              Панель пишет напрямую в {ADMIN_REPO.owner}/{ADMIN_REPO.repo} (ветка{" "}
              {ADMIN_REPO.branch}): {CASES_JSON_PATH} и файлы в {CASES_REPO_DIR}/. Один
              «Опубликовать» — один коммит, дальше GitHub Actions собирает сайт и заливает
              его на хостинг.
            </>
          )}
        </p>
      </main>

      {dirty && problems.length === 0 && (
        <DirtyDock publishing={publishing} onPublish={() => void publish()} />
      )}
    </div>
  );
}

/**
 * Фильтр по услугам. В отличие от каталога на сайте, здесь показываются и
 * пустые категории: владельцу важно видеть, что кейсов по услуге пока нет.
 */
function ServiceFilter({
  counts,
  total,
  active,
  onChange,
}: {
  counts: Record<string, number>;
  total: number;
  active: string | null;
  onChange: (key: string | null) => void;
}) {
  const options: FilterOption[] = [
    { value: null, label: "Все кейсы", count: total },
    ...SERVICE_OPTIONS.map((option) => ({
      value: option.key,
      label: option.title,
      count: counts[option.key] ?? 0,
    })),
  ];

  return (
    <FilterSelect
      label="Услуга"
      options={options}
      value={active}
      onChange={onChange}
      className="w-full sm:w-[28rem]"
    />
  );
}

/**
 * Услуги, на страницах которых показывается кейс. Выпадающий список с
 * множественным выбором, рядом — плашки выбранного: так видно результат, не
 * открывая список.
 */
function ServicePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (services: string[]) => void;
}) {
  return (
    <div className="md:col-span-2">
      <MultiFilterSelect
        label="Услуги кейса"
        placeholder="Выбрать услуги"
        options={SERVICE_OPTIONS.map((option) => ({
          value: option.key,
          label: option.title,
        }))}
        selected={selected}
        onChange={onChange}
      />
    </div>
  );
}

function CaseRow({
  draft,
  index,
  open,
  draggable,
  onToggle,
  onChange,
  onRename,
  takenSlugs,
  onDelete,
  onImage,
}: {
  draft: DraftCase;
  index: number;
  open: boolean;
  /** С включённым фильтром список неполный, и перетаскивание сбило бы порядок. */
  draggable: boolean;
  onToggle: () => void;
  onChange: (changes: Partial<DraftCase>) => void;
  onRename: (slug: string) => void;
  takenSlugs: string[];
  onDelete: () => void;
  onImage: (slot: CaseImageSlot, file: File) => void;
}) {
  const controls = useDragControls();
  const onHome = index < HOME_CASE_COUNT;
  const usedOn = serviceTitles(draft.services);

  return (
    <Reorder.Item
      value={draft}
      dragListener={false}
      dragControls={controls}
      className="border-border bg-background overflow-hidden rounded-2xl border"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
        <button
          type="button"
          aria-label={
            draggable ? "Перетащить для смены порядка" : "Порядок меняется без фильтра"
          }
          disabled={!draggable}
          onPointerDown={(event) => draggable && controls.start(event)}
          className={cn(
            "text-muted-foreground rounded-lg p-2 transition-colors",
            draggable
              ? "hover:bg-muted hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
              : "cursor-not-allowed opacity-30",
          )}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="text-muted-foreground hidden w-7 text-sm tabular-nums sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="bg-muted h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          {currentImage(draft, "cover") ? (
            // Local previews and repo paths alike — plain <img>, no optimizer here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage(draft, "cover")}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <span className="block leading-snug font-medium">
            {draft.title || <span className="text-muted-foreground">Без названия</span>}
          </span>
          {/* Подробности прячем на телефоне: в узкой строке они переносились
              по слогам и превращали карточку в кашу. */}
          <span className="text-muted-foreground mt-0.5 hidden flex-wrap items-center gap-2 text-xs sm:flex">
            <code>{draft.slug}</code>
            {onHome && <span className="text-accent-foreground/70">· на главной</span>}
            {usedOn.length > 0 && (
              <span className="break-words">· услуги: {usedOn.join(", ")}</span>
            )}
            {Object.keys(draft.pending).length > 0 && (
              <span className="bg-accent-soft rounded-full px-2 py-0.5">
                новых картинок: {Object.keys(draft.pending).length}
              </span>
            )}
          </span>
        </button>

        {/* На телефоне кнопки занимают всю ширину и уходят на вторую строку:
            рядом с ними заголовку оставалось сантиметра три, и он рассыпался
            в столбик по слогам. */}
        <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            onClick={onToggle}
            className="border-border hover:border-foreground cursor-pointer rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors"
          >
            {open ? "Свернуть" : "Изменить"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Удалить кейс"
            className="text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-border bg-muted/30 border-t p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Заголовок"
              value={draft.title}
              onChange={(title) => {
                onChange({ title });
                // While the case has never been published its key tracks the title.
                if (draft.isNew) {
                  const next = uniqueSlug(
                    slugify(title),
                    takenSlugs.filter((slug) => slug !== draft.slug),
                  );
                  if (next) onRename(next);
                }
              }}
            />
            <Field
              label="Теги"
              value={draft.tagsDraft}
              hint="Через запятую: CRM, Automation, Real Estate"
              onChange={(tagsDraft) => onChange({ tagsDraft })}
            />
            <ServicePicker
              selected={draft.services}
              onChange={(services) => onChange({ services })}
            />
            <Field
              label="Описание"
              value={draft.description}
              multiline
              onChange={(description) => onChange({ description })}
            />
            <Field
              label="Цитата клиента"
              value={draft.quote}
              multiline
              hint="Без кавычек — они добавляются в вёрстке."
              onChange={(quote) => onChange({ quote })}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SLOT_ORDER.map((slot) => (
              <ImageDrop
                key={slot}
                slot={slot}
                preview={currentImage(draft, slot)}
                pendingBytes={draft.pending[slot]?.bytes ?? null}
                onPick={(file) => onImage(slot, file)}
              />
            ))}
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}
