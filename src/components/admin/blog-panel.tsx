"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiFilterSelect } from "@/components/ui/filter-select";
import {
  estimateReadingTime,
  formatPostDate,
  type BlogPost,
  type BlogSection,
} from "@/lib/blog";
import { ADMIN_REPO, BLOG_JSON_PATH } from "@/lib/admin/github";
import type { BlogApi, BlogPublishResult } from "@/lib/admin/blog-api";
import { ADMIN_MODE } from "@/lib/admin/auth";
import { BLOG_REPO_DIR, assetPaths, processImage } from "@/lib/admin/images";
import type { ProcessedImage } from "@/lib/admin/images";
import {
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
 * Раздел «Блог»: список статей, их порядок и текст.
 *
 * Устройство повторяет раздел кейсов — черновики живут в браузере, «Опубликовать»
 * отправляет весь список разом. Разница в форме контента: у статьи есть тело,
 * поэтому абзацы правятся не полем на строку, а обычным текстом — раздел
 * набирается одной областью, пустая строка разделяет абзацы. Так пишут в любом
 * редакторе, и владельцу не приходится думать о том, что абзац — это элемент
 * массива.
 */

interface DraftSection {
  /** Ключ для React: заголовок правится по букве и ключом быть не может. */
  key: string;
  heading: string;
  /** Абзацы одной строкой; пустая строка между ними — граница абзаца. */
  bodyDraft: string;
}

interface DraftPost extends Omit<BlogPost, "sections" | "takeaways"> {
  draftId: string;
  sections: DraftSection[];
  /** Выводы: по одному в строке. */
  takeawaysDraft: string;
  /** Обложка, обработанная в браузере, но ещё не отправленная. */
  pending?: ProcessedImage;
  /** True, пока статья ни разу не публиковалась (адрес ещё подстраивается). */
  isNew?: boolean;
}

const EMPTY_POST = {
  title: "",
  excerpt: "",
  category: "",
  lead: "",
  metaTitle: "",
  metaDescription: "",
  cover: "",
  readingTime: 1,
  services: [] as string[],
};

function toBodyDraft(body: string[]): string {
  return body.join("\n\n");
}

/** Текст раздела → абзацы. Пустые строки схлопываются, лишние пробелы уходят. */
function parseBody(draft: string): string[] {
  return draft
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

function parseLines(draft: string): string[] {
  return draft
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toDrafts(posts: BlogPost[]): DraftPost[] {
  return posts.map((post) => ({
    ...post,
    draftId: crypto.randomUUID(),
    sections: post.sections.map((section) => ({
      key: crypto.randomUUID(),
      heading: section.heading,
      bodyDraft: toBodyDraft(section.body),
    })),
    takeawaysDraft: post.takeaways.join("\n"),
  }));
}

/** Обложка новой статьи названа по адресу, а адрес меняется, пока статью пишут. */
function coverPath(draft: DraftPost): string {
  return draft.pending
    ? assetPaths("blogCover", draft.slug, draft.pending.hash).path
    : draft.cover;
}

function toSections(draft: DraftPost): BlogSection[] {
  return draft.sections
    .map((section) => ({
      heading: section.heading.trim(),
      body: parseBody(section.bodyDraft),
    }))
    .filter((section) => section.heading || section.body.length);
}

/** blog.json как он уедет в репозиторий — служебные поля черновика отброшены. */
function serialize(drafts: DraftPost[]): BlogPost[] {
  return drafts.map((draft) => ({
    id: draft.id,
    slug: draft.slug,
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    category: draft.category.trim(),
    lead: draft.lead.trim(),
    metaTitle: draft.metaTitle.trim(),
    metaDescription: draft.metaDescription.trim(),
    cover: coverPath(draft),
    readingTime: draft.readingTime,
    sections: toSections(draft),
    takeaways: parseLines(draft.takeawaysDraft),
    services: draft.services,
    publishedAt: draft.publishedAt,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  }));
}

function currentCover(draft: DraftPost): string {
  return draft.pending?.previewUrl || draft.cover || "";
}

function validate(drafts: DraftPost[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  drafts.forEach((draft, index) => {
    const label = draft.title.trim() || `статья №${index + 1}`;
    if (!draft.slug) problems.push(`«${label}»: пустой адрес (slug)`);
    if (seen.has(draft.slug)) problems.push(`Адрес «${draft.slug}» повторяется`);
    seen.add(draft.slug);

    if (!draft.title.trim()) problems.push(`Статья №${index + 1}: не заполнен заголовок`);
    if (!draft.category.trim()) problems.push(`«${label}»: не заполнена рубрика`);
    if (!draft.excerpt.trim()) problems.push(`«${label}»: нет описания для карточки`);
    if (!draft.lead.trim()) problems.push(`«${label}»: нет вступления`);
    if (!draft.metaTitle.trim())
      problems.push(`«${label}»: не заполнен title для поиска`);
    if (!draft.metaDescription.trim())
      problems.push(`«${label}»: не заполнен description для поиска`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.publishedAt))
      problems.push(`«${label}»: некорректная дата публикации`);
    if (!currentCover(draft)) problems.push(`«${label}»: нет обложки`);

    const sections = toSections(draft);
    if (!sections.length) problems.push(`«${label}»: в статье нет ни одного раздела`);
    sections.forEach((section, position) => {
      if (!section.heading)
        problems.push(`«${label}»: у раздела №${position + 1} нет заголовка`);
      if (!section.body.length)
        problems.push(
          `«${label}»: раздел «${section.heading || position + 1}» без текста`,
        );
    });
  });

  return problems;
}

/** Сегодня в виде YYYY-MM-DD — дата публикации новой статьи по умолчанию. */
function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function BlogPanel({
  api,
  tab,
  onTab,
  onLogout,
  userEmail,
}: {
  api: BlogApi;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onLogout: () => void;
  userEmail?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [baseline, setBaseline] = useState<BlogPost[]>([]);
  const [version, setVersion] = useState<string | null>(null);
  /** Пути обложек, которые освободились после замены или удаления статьи. */
  const [orphaned, setOrphaned] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<BlogPublishResult | null>(null);

  const load = useCallback(async (activeApi: BlogApi) => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await activeApi.load();
      const loaded = toDrafts(snapshot.posts);
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
  const problems = useMemo(() => validate(drafts), [drafts]);
  const pendingImageCount = useMemo(
    () => drafts.filter((draft) => draft.pending).length,
    [drafts],
  );
  const dirty =
    JSON.stringify(serialized) !== JSON.stringify(baseline) || pendingImageCount > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (draftId: string, changes: Partial<DraftPost>) =>
    setDrafts((list) =>
      list.map((draft) => (draft.draftId === draftId ? { ...draft, ...changes } : draft)),
    );

  const addPost = () => {
    const slug = uniqueSlug(
      "novaya-statya",
      drafts.map((draft) => draft.slug),
    );
    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();
    setDrafts((list) => [
      // Новая статья идёт первой: блог показывает список сверху вниз, а свежий
      // текст — то, ради чего в блог заходят.
      {
        id: crypto.randomUUID(),
        slug,
        draftId,
        ...EMPTY_POST,
        sections: [{ key: crypto.randomUUID(), heading: "", bodyDraft: "" }],
        takeawaysDraft: "",
        publishedAt: today(),
        createdAt: now,
        updatedAt: now,
        isNew: true,
      },
      ...list,
    ]);
    setOpenId(draftId);
    setPublished(null);
  };

  const removePost = (draftId: string) => {
    const draft = drafts.find((item) => item.draftId === draftId);
    if (!draft) return;
    if (
      !window.confirm(
        `Удалить статью «${draft.title || draft.slug}»?\n\nСтраница /blog/${draft.slug}/ исчезнет с сайта, а её адрес начнёт отдавать 404.`,
      )
    ) {
      return;
    }

    if (draft.cover) setOrphaned((list) => [...list, draft.cover]);
    if (draft.pending) URL.revokeObjectURL(draft.pending.previewUrl);
    setDrafts((list) => list.filter((item) => item.draftId !== draftId));
    if (openId === draftId) setOpenId(null);
  };

  const attachCover = async (draftId: string, file: File) => {
    setError(null);
    const draft = drafts.find((item) => item.draftId === draftId);
    if (!draft) return;
    try {
      const processed = await processImage(file, "blogCover");
      if (draft.pending) URL.revokeObjectURL(draft.pending.previewUrl);
      // Старая обложка становится мусором, как только её заменили.
      if (draft.cover) setOrphaned((list) => [...list, draft.cover]);
      patch(draftId, { pending: processed });
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
      // updatedAt двигаем только у реально изменившихся статей: он уезжает в
      // sitemap как lastmod, и «обновить всё разом» там означает соврать.
      const nextPosts = serialize(drafts).map((post) => {
        const before = baseline.find((previous) => previous.id === post.id);
        const same =
          before &&
          JSON.stringify({ ...before, updatedAt: "" }) ===
            JSON.stringify({ ...post, updatedAt: "" });
        return same ? post : { ...post, updatedAt: now };
      });

      const referenced = new Set(nextPosts.map((post) => post.cover));
      // Удаляем только то, что панель сама и загрузила: рисованные SVG первых
      // статей лежат в той же папке, и стирать их автоматикой нельзя.
      const deletions = Array.from(new Set(orphaned))
        .filter((path) => /^\/blog\/post-.+\.webp$/.test(path) && !referenced.has(path))
        .map((path) => `public${path}`);

      const uploads = drafts.flatMap((draft) =>
        draft.pending
          ? [
              {
                postId: draft.id,
                path: assetPaths("blogCover", draft.slug, draft.pending.hash).repoPath,
                blob: draft.pending.blob,
              },
            ]
          : [],
      );

      const added = nextPosts.length - baseline.length;
      const summary = [
        added > 0 ? `+${added}` : added < 0 ? `${added}` : null,
        pendingImageCount ? `${pendingImageCount} img` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const result = await api.publish({
        posts: nextPosts,
        uploads,
        deletions,
        baseVersion: version,
        summary,
      });

      // Превью уже уехали — освобождаем blob-URL до очистки состояния
      // (вне state-updater: в dev React может вызвать его дважды).
      drafts.forEach((draft) => {
        if (draft.pending) URL.revokeObjectURL(draft.pending.previewUrl);
      });

      setPublished(result);
      setBaseline(nextPosts);
      setVersion(result.version);
      setOrphaned([]);
      setDrafts((list) =>
        list.map((draft) => {
          const saved = nextPosts.find((post) => post.id === draft.id);
          return {
            ...draft,
            cover: saved?.cover ?? draft.cover,
            updatedAt: saved?.updatedAt ?? draft.updatedAt,
            pending: undefined,
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
        title="Блог"
        subtitle={`${drafts.length} шт. · порядок в списке — порядок на /blog${
          userEmail ? ` · ${userEmail}` : ""
        }`}
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
              <p className="text-muted-foreground text-sm">
                Перетаскивай карточки, чтобы поменять порядок статей в блоге.
              </p>
              <button
                type="button"
                onClick={addPost}
                className="border-foreground/40 hover:border-foreground hover:bg-background ml-auto inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-dashed px-6 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Добавить статью
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={drafts}
              onReorder={setDrafts}
              className="space-y-3"
            >
              {drafts.map((draft, index) => (
                <PostRow
                  key={draft.draftId}
                  draft={draft}
                  index={index}
                  open={openId === draft.draftId}
                  onToggle={() =>
                    setOpenId(openId === draft.draftId ? null : draft.draftId)
                  }
                  onChange={(changes) => patch(draft.draftId, changes)}
                  onRename={(slug) => patch(draft.draftId, { slug })}
                  takenSlugs={drafts.map((item) => item.slug)}
                  onDelete={() => removePost(draft.draftId)}
                  onCover={(file) => void attachCover(draft.draftId, file)}
                />
              ))}
            </Reorder.Group>
          </>
        )}

        <p className="text-muted-foreground mt-10 text-xs leading-relaxed">
          {ADMIN_MODE === "api" ? (
            <>
              Правки сохраняются в базу сразу, а «Опубликовать» отправляет снапшот в
              репозиторий — дальше GitHub Actions собирает сайт и заливает его на хостинг.
              Статьи остаются в статике, поэтому поисковики видят их как обычные страницы.
            </>
          ) : (
            <>
              Панель пишет напрямую в {ADMIN_REPO.owner}/{ADMIN_REPO.repo} (ветка{" "}
              {ADMIN_REPO.branch}): {BLOG_JSON_PATH} и обложки в {BLOG_REPO_DIR}/. Один
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

function PostRow({
  draft,
  index,
  open,
  onToggle,
  onChange,
  onRename,
  takenSlugs,
  onDelete,
  onCover,
}: {
  draft: DraftPost;
  index: number;
  open: boolean;
  onToggle: () => void;
  onChange: (changes: Partial<DraftPost>) => void;
  onRename: (slug: string) => void;
  takenSlugs: string[];
  onDelete: () => void;
  onCover: (file: File) => void;
}) {
  const controls = useDragControls();
  const about = serviceTitles(draft.services);

  const patchSection = (key: string, changes: Partial<DraftSection>) =>
    onChange({
      sections: draft.sections.map((section) =>
        section.key === key ? { ...section, ...changes } : section,
      ),
    });

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= draft.sections.length) return;
    const next = [...draft.sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ sections: next });
  };

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
          aria-label="Перетащить для смены порядка"
          onPointerDown={(event) => controls.start(event)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab touch-none rounded-lg p-2 transition-colors active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="text-muted-foreground hidden w-7 text-sm tabular-nums sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="bg-muted h-12 w-[4.8rem] shrink-0 overflow-hidden rounded-lg">
          {currentCover(draft) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentCover(draft)}
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
          <span className="text-muted-foreground mt-0.5 hidden flex-wrap items-center gap-2 text-xs sm:flex">
            <code>{draft.slug}</code>
            <span>· {formatPostDate(draft.publishedAt)}</span>
            {draft.category && <span>· {draft.category}</span>}
            <span>· {draft.sections.length} разд.</span>
            {about.length > 0 && (
              <span className="break-words">· услуги: {about.join(", ")}</span>
            )}
            {draft.pending && (
              <span className="bg-accent-soft rounded-full px-2 py-0.5">
                новая обложка
              </span>
            )}
          </span>
        </button>

        <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
          {!draft.isNew && (
            <a
              href={`/blog/${draft.slug}/`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground hidden text-sm underline sm:inline"
            >
              На сайте
            </a>
          )}
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
            aria-label="Удалить статью"
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
              hint={
                draft.isNew
                  ? "Адрес статьи собирается из заголовка, пока она не опубликована."
                  : `Адрес /blog/${draft.slug}/ уже проиндексирован и не меняется.`
              }
              onChange={(title) => {
                onChange({ title });
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
              label="Рубрика"
              value={draft.category}
              hint="Одно-два слова: Безопасность, Разработка, Данные."
              onChange={(category) => onChange({ category })}
            />

            <label className="block text-sm">
              <span className="font-medium">Дата публикации</span>
              <input
                type="date"
                value={draft.publishedAt}
                onChange={(event) => onChange({ publishedAt: event.target.value })}
                className="border-border bg-background focus:border-foreground mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors outline-none"
              />
              <span className="text-muted-foreground mt-1 block text-xs">
                Показывается в карточке и уезжает в разметку статьи.
              </span>
            </label>

            <ReadingTimeField
              minutes={draft.readingTime}
              onChange={(readingTime) => onChange({ readingTime })}
              onEstimate={() =>
                onChange({
                  readingTime: estimateReadingTime({
                    lead: draft.lead,
                    sections: toSections(draft),
                    takeaways: parseLines(draft.takeawaysDraft),
                  }),
                })
              }
            />

            <div className="md:col-span-2">
              <MultiFilterSelect
                label="Услуги, о которых статья"
                placeholder="Выбрать услуги"
                options={SERVICE_OPTIONS.map((option) => ({
                  value: option.key,
                  label: option.title,
                }))}
                selected={draft.services}
                onChange={(services) => onChange({ services })}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Связь работает в обе стороны: внизу статьи появятся эти услуги, а на их
                страницах — эта статья.
              </p>
            </div>

            <Field
              label="Описание для карточки"
              value={draft.excerpt}
              multiline
              hint="Два-три предложения. Видно в списке блога."
              onChange={(excerpt) => onChange({ excerpt })}
            />
            <Field
              label="Вступление"
              value={draft.lead}
              multiline
              hint="Первый абзац под заголовком, крупным шрифтом."
              onChange={(lead) => onChange({ lead })}
            />
            <Field
              label="Title для поиска"
              value={draft.metaTitle}
              hint="До 60 знаков — длиннее Google обрезает."
              onChange={(metaTitle) => onChange({ metaTitle })}
            />
            <Field
              label="Description для поиска"
              value={draft.metaDescription}
              multiline
              hint="150–160 знаков. Это текст под ссылкой в выдаче."
              onChange={(metaDescription) => onChange({ metaDescription })}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,20rem)_1fr]">
            <ImageDrop
              slot="blogCover"
              preview={currentCover(draft)}
              pendingBytes={draft.pending?.bytes ?? null}
              onPick={onCover}
            />
            <Field
              label="Коротко (выводы в конце статьи)"
              value={draft.takeawaysDraft}
              multiline
              rows={8}
              hint="По одному пункту в строке. Пусто — блок не показывается."
              onChange={(takeawaysDraft) => onChange({ takeawaysDraft })}
            />
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-medium">Разделы статьи</h3>
              <p className="text-muted-foreground text-xs">
                Заголовки собираются в оглавление автоматически.
              </p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    sections: [
                      ...draft.sections,
                      { key: crypto.randomUUID(), heading: "", bodyDraft: "" },
                    ],
                  })
                }
                className="border-foreground/40 hover:border-foreground hover:bg-background ml-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-dashed px-4 text-xs font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить раздел
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {draft.sections.map((section, position) => (
                <SectionEditor
                  key={section.key}
                  section={section}
                  position={position}
                  total={draft.sections.length}
                  onChange={(changes) => patchSection(section.key, changes)}
                  onMove={(delta) => moveSection(position, position + delta)}
                  onDelete={() =>
                    onChange({
                      sections: draft.sections.filter((item) => item.key !== section.key),
                    })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

/**
 * Время чтения. Считается по объёму текста, но остаётся редактируемым: у
 * статьи со схемами и списками реальное время другое, а спорить с оценкой
 * владелец не должен.
 */
function ReadingTimeField({
  minutes,
  onChange,
  onEstimate,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  onEstimate: () => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">Время чтения, мин</span>
      <span className="mt-1.5 flex gap-2">
        <input
          type="number"
          min={1}
          max={90}
          value={minutes}
          onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
          className="border-border bg-background focus:border-foreground w-24 rounded-xl border px-3.5 py-2.5 text-sm transition-colors outline-none"
        />
        <button
          type="button"
          onClick={onEstimate}
          className="border-border hover:border-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-xs font-medium transition-colors"
        >
          <Calculator className="h-3.5 w-3.5" />
          Посчитать по тексту
        </button>
      </span>
    </label>
  );
}

function SectionEditor({
  section,
  position,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  section: DraftSection;
  position: number;
  total: number;
  onChange: (changes: Partial<DraftSection>) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}) {
  const paragraphs = parseBody(section.bodyDraft).length;

  return (
    <div className="border-border bg-background rounded-xl border p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-7 shrink-0 text-sm tabular-nums">
          {String(position + 1).padStart(2, "0")}
        </span>
        <input
          type="text"
          value={section.heading}
          placeholder="Заголовок раздела"
          onChange={(event) => onChange({ heading: event.target.value })}
          className="border-border focus:border-foreground min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors outline-none"
        />
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Выше"
            disabled={position === 0}
            onClick={() => onMove(-1)}
            className={cn(
              "text-muted-foreground rounded-lg p-2 transition-colors",
              position === 0
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-muted hover:text-foreground cursor-pointer",
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Ниже"
            disabled={position === total - 1}
            onClick={() => onMove(1)}
            className={cn(
              "text-muted-foreground rounded-lg p-2 transition-colors",
              position === total - 1
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-muted hover:text-foreground cursor-pointer",
            )}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Удалить раздел"
            onClick={onDelete}
            className="text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea
        rows={8}
        value={section.bodyDraft}
        placeholder="Текст раздела. Пустая строка разделяет абзацы."
        onChange={(event) => onChange({ bodyDraft: event.target.value })}
        className="border-border bg-background focus:border-foreground mt-2 w-full resize-y rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed transition-colors outline-none"
      />
      <p className="text-muted-foreground mt-1 text-xs">
        {paragraphs} {paragraphs === 1 ? "абзац" : paragraphs < 5 ? "абзаца" : "абзацев"}
      </p>
    </div>
  );
}
