import type { ServiceCatalog } from "@/lib/services/types";
import {
  SERVICES_JSON_PATH,
  actionsUrl,
  commitFiles,
  commitUrl,
  readJson,
} from "./github";

/**
 * Шов записи каталога услуг — тот же контракт, что у `CasesApi` и `BlogApi`.
 *
 * Панель правит только структуру: разделы, их порядок, к какому разделу
 * относится услуга и опубликована ли она. Тексты страниц остаются в
 * `content/services.json` и правятся в репозитории — их в панели нет
 * намеренно, иначе вкладка превратилась бы в редактор двенадцати полей на
 * тридцать две страницы.
 */
export interface ServicesApi {
  /** Человекочитаемое имя источника — показывается в интерфейсе. */
  readonly sourceLabel: string;
  load(): Promise<ServicesSnapshot>;
  publish(input: ServicesPublishInput): Promise<ServicesPublishResult>;
}

export interface ServicesSnapshot extends ServiceCatalog {
  /**
   * Версия, на которой панель открылась. Уезжает обратно при публикации, чтобы
   * сервер отклонил запись, если каталог успели поменять в другом окне.
   */
  version: string;
}

export interface ServicesPublishInput extends ServiceCatalog {
  baseVersion: string;
}

export interface ServicesPublishResult {
  version: string;
  changeUrl?: string;
  buildUrl?: string;
  /**
   * Правки сохранены, но на сайт не уехали — например, серверу не выдан доступ
   * к репозиторию. Не ошибка: терять сохранённое нельзя, поэтому панель
   * показывает предупреждение, а не красный сбой.
   */
  warning?: string;
}

/** Реализация поверх GitHub: каталог уезжает одним коммитом. */
export function githubServicesApi(token: string): ServicesApi {
  return {
    sourceLabel: SERVICES_JSON_PATH,

    async load() {
      const state = await readJson<ServiceCatalog>(token, SERVICES_JSON_PATH);
      return { ...state.data, version: state.headSha };
    },

    async publish({ categories, services, baseVersion }) {
      const sha = await commitFiles(token, {
        message: `content(services): каталог через /panel (${categories.length} разделов, ${services.length} услуг)`,
        files: [
          {
            path: SERVICES_JSON_PATH,
            text: `${JSON.stringify({ categories, services }, null, 2)}\n`,
          },
        ],
        deletions: [],
        expectedHeadSha: baseVersion,
      });

      return { version: sha, changeUrl: commitUrl(sha), buildUrl: actionsUrl() };
    },
  };
}
