import type { BlogPost } from "@/lib/blog";
import type { CasesPublishResult } from "./cases-api";
import { BLOG_JSON_PATH, actionsUrl, commitFiles, commitUrl, readJson } from "./github";

/**
 * Шов записи для раздела «Блог» в панели.
 *
 * Устроен так же, как `CasesApi`, и по той же причине: панель не знает, куда
 * уезжают статьи. В режиме токена это коммит в репозиторий, в режиме API —
 * своя база (`httpBlogApi`). Общий у них только контракт, поэтому интерфейс
 * отдельный, а не «CasesApi с другим путём»: у статьи один слот картинки и
 * своя валидация, и сводить их в один тип значило бы вечно проверять, какой
 * из двух наборов полей сейчас в руках.
 */
export interface BlogApi {
  /** Человекочитаемое имя источника — показывается в интерфейсе. */
  readonly sourceLabel: string;
  load(): Promise<BlogSnapshot>;
  publish(input: BlogPublishInput): Promise<BlogPublishResult>;
}

export interface BlogSnapshot {
  posts: BlogPost[];
  /** Версия, на которой панель открылась, — см. `CasesSnapshot.version`. */
  version: string;
}

export interface BlogUpload {
  /** Статья, которой принадлежит обложка. */
  postId: string;
  /** Путь ассета внутри репозитория — им пользуется GitHub-реализация. */
  path: string;
  blob: Blob;
}

export interface BlogPublishInput {
  posts: BlogPost[];
  uploads: BlogUpload[];
  /** Пути обложек, на которые больше никто не ссылается. */
  deletions: string[];
  baseVersion: string;
  summary?: string;
}

/** Результат публикации у блога и у кейсов одинаковый — коммит и сборка. */
export type BlogPublishResult = CasesPublishResult;

/** Реализация поверх GitHub: правки уезжают одним атомарным коммитом. */
export function githubBlogApi(token: string): BlogApi {
  return {
    sourceLabel: BLOG_JSON_PATH,

    async load() {
      const state = await readJson<BlogPost[]>(token, BLOG_JSON_PATH);
      return { posts: state.data, version: state.headSha };
    },

    async publish({ posts, uploads, deletions, baseVersion, summary }) {
      const sha = await commitFiles(token, {
        message: `content(blog): обновление через /panel${summary ? ` (${summary})` : ""}`,
        files: [
          { path: BLOG_JSON_PATH, text: `${JSON.stringify(posts, null, 2)}\n` },
          ...uploads.map((upload) => ({ path: upload.path, blob: upload.blob })),
        ],
        deletions,
        expectedHeadSha: baseVersion,
      });

      return { version: sha, changeUrl: commitUrl(sha), buildUrl: actionsUrl() };
    },
  };
}
