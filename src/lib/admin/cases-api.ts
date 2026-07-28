import type { CaseItem } from "@/lib/cases";
import { CASES_JSON_PATH, actionsUrl, commitFiles, commitUrl, readCases } from "./github";

/**
 * Шов записи для панели /admin.
 *
 * Панель не знает, куда именно уезжают кейсы. Сегодня за этим интерфейсом
 * GitHub: коммит в репозиторий, дальше CI пересобирает сайт. Завтра —
 * `HttpCasesApi` поверх собственного API с логином и сессионной кукой
 * (см. docs/backend.md); поменяется одна строка в `admin-panel.tsx`.
 */
export interface CasesApi {
  /** Человекочитаемое имя источника — показывается в интерфейсе. */
  readonly sourceLabel: string;
  load(): Promise<CasesSnapshot>;
  publish(input: CasesPublishInput): Promise<CasesPublishResult>;
}

export interface CasesSnapshot {
  cases: CaseItem[];
  /**
   * Версия, на которой панель открылась. Уезжает обратно при публикации, чтобы
   * сервер отклонил запись, если данные успели поменяться. Сейчас это SHA
   * коммита, в будущем — `updated_at` или счётчик ревизий.
   */
  version: string;
}

export interface CasesUpload {
  /** Кейс, которому принадлежит картинка. */
  caseId: string;
  /** Какой из трёх слотов заполняется. */
  slot: "cover" | "detail" | "detailMobile";
  /** Путь ассета внутри репозитория — им пользуется GitHub-реализация. */
  path: string;
  blob: Blob;
}

export interface CasesPublishInput {
  cases: CaseItem[];
  uploads: CasesUpload[];
  /** Пути ассетов, на которые больше никто не ссылается. */
  deletions: string[];
  baseVersion: string;
  /** Короткая сводка изменений для сообщения коммита / журнала. */
  summary?: string;
}

export interface CasesPublishResult {
  version: string;
  /** Куда посмотреть, что именно уехало (ссылка на коммит). */
  changeUrl?: string;
  /** Куда посмотреть, как идёт пересборка сайта. */
  buildUrl?: string;
}

/** Реализация поверх GitHub: правки уезжают одним атомарным коммитом. */
export function githubCasesApi(token: string): CasesApi {
  return {
    sourceLabel: CASES_JSON_PATH,

    async load() {
      const state = await readCases<CaseItem[]>(token);
      return { cases: state.data, version: state.headSha };
    },

    async publish({ cases, uploads, deletions, baseVersion, summary }) {
      const sha = await commitFiles(token, {
        message: `content(cases): обновление через /admin${summary ? ` (${summary})` : ""}`,
        files: [
          { path: CASES_JSON_PATH, text: `${JSON.stringify(cases, null, 2)}\n` },
          ...uploads.map((upload) => ({ path: upload.path, blob: upload.blob })),
        ],
        deletions,
        expectedHeadSha: baseVersion,
      });

      return { version: sha, changeUrl: commitUrl(sha), buildUrl: actionsUrl() };
    },
  };
}
