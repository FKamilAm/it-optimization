import type { BlogPost } from "@/lib/blog";
import type { CaseItem } from "@/lib/cases";
import { apiFetch, readApiError } from "./auth";
import type { BlogApi, BlogPublishInput, BlogPublishResult } from "./blog-api";
import type {
  CasesApi,
  CasesPublishInput,
  CasesPublishResult,
  CasesUpload,
} from "./cases-api";
import type {
  ServicesApi,
  ServicesPublishInput,
  ServicesPublishResult,
} from "./services-api";
import type { ServiceCatalog } from "@/lib/services/types";

/**
 * Реализация `CasesApi` поверх собственного API (server/).
 *
 * Публикация здесь — три шага вместо одного коммита: сохранить список, залить
 * новые картинки, запустить сборку. Атомарности GitHub-режима тут нет, зато
 * промежуточное состояние живёт в базе и никуда не теряется: если шаг упал,
 * правки уже сохранены, а на сайт ничего не уехало.
 */

/** У сервера кейс дополнительно несёт `status`; сайту он не нужен. */
interface ServerCase extends CaseItem {
  status?: "draft" | "published";
}

function toCaseItem({ status: _status, ...item }: ServerCase): CaseItem {
  return item;
}

/** Панель называет слоты по-своему; в базе они в snake_case. */
const SLOT_PATH: Record<CasesUpload["slot"], string> = {
  cover: "cover",
  detail: "detail",
  detailMobile: "detail_mobile",
};

export function httpCasesApi(): CasesApi {
  return {
    sourceLabel: "база данных",

    async load() {
      const response = await apiFetch("/cases");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Не удалось загрузить кейсы"));
      }
      const body = (await response.json()) as { cases: ServerCase[]; version: string };
      return { cases: body.cases.map(toCaseItem), version: body.version };
    },

    async publish(input: CasesPublishInput): Promise<CasesPublishResult> {
      // 1. Список целиком: порядок — такое же свойство контента, как заголовок.
      const saved = await apiFetch("/cases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cases: input.cases.map((item) => ({
            id: item.id,
            slug: item.slug,
            status: "published",
            title: item.title,
            description: item.description,
            quote: item.quote,
            tags: item.tags,
            // Без этого поля сервер оставляет привязку к услугам как есть, и
            // правки категорий в панели просто не доезжали до базы.
            services: item.services,
          })),
          version: input.baseVersion,
        }),
      });

      if (!saved.ok) {
        throw new Error(await readApiError(saved, "Не удалось сохранить изменения"));
      }
      let { version } = (await saved.json()) as { version: string };

      // 2. Новые картинки. Сервер пересобирает их заново — присланному файлу
      //    доверять нельзя, даже если панель его уже обработала.
      for (const upload of input.uploads) {
        const form = new FormData();
        form.append("file", upload.blob, upload.path.split("/").pop() || "image.webp");

        const uploaded = await apiFetch(
          `/cases/${upload.caseId}/assets/${SLOT_PATH[upload.slot]}`,
          { method: "POST", body: form },
        );
        if (!uploaded.ok) {
          throw new Error(await readApiError(uploaded, "Не удалось загрузить картинку"));
        }
        ({ version } = (await uploaded.json()) as { version: string });
      }

      // 3. Снапшот уезжает в репозиторий, дальше пересобирается статика.
      const published = await apiFetch("/cases/publish", { method: "POST" });
      if (!published.ok) {
        throw new Error(await readApiError(published, "Не удалось опубликовать"));
      }
      const result = (await published.json()) as {
        published: boolean;
        reason?: string;
        commitUrl?: string;
        buildUrl?: string;
      };

      // Если снапшот никуда не уехал (например, серверу не выдан доступ к
      // репозиторию), это не повод бросать ошибку: правки уже в базе, и
      // потерять достигнутую версию нельзя — иначе повторная попытка упрётся в
      // конфликт версий. Возвращаем успех с предупреждением.
      return {
        version,
        changeUrl: result.commitUrl,
        buildUrl: result.buildUrl,
        warning: result.published ? undefined : result.reason,
      };
    },
  };
}

/** Та же реализация для статей блога: сохранить список, залить обложки, собрать. */

/** У сервера статья дополнительно несёт `status`; сайту он не нужен. */
interface ServerPost extends BlogPost {
  status?: "draft" | "published";
}

function toBlogPost({ status: _status, ...post }: ServerPost): BlogPost {
  return post;
}

export function httpBlogApi(): BlogApi {
  return {
    sourceLabel: "база данных",

    async load() {
      const response = await apiFetch("/posts");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Не удалось загрузить статьи"));
      }
      const body = (await response.json()) as { posts: ServerPost[]; version: string };
      return { posts: body.posts.map(toBlogPost), version: body.version };
    },

    async publish(input: BlogPublishInput): Promise<BlogPublishResult> {
      // 1. Список целиком — порядок статей в блоге тоже контент.
      const saved = await apiFetch("/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: input.posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            status: "published",
            title: post.title,
            excerpt: post.excerpt,
            category: post.category,
            lead: post.lead,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            readingTime: post.readingTime,
            sections: post.sections,
            takeaways: post.takeaways,
            services: post.services,
            publishedAt: post.publishedAt,
          })),
          version: input.baseVersion,
        }),
      });

      if (!saved.ok) {
        throw new Error(await readApiError(saved, "Не удалось сохранить изменения"));
      }
      let { version } = (await saved.json()) as { version: string };

      // 2. Новые обложки. Сервер пересобирает их через sharp — присланному
      //    файлу доверять нельзя, даже если панель его уже обработала.
      for (const upload of input.uploads) {
        const form = new FormData();
        form.append("file", upload.blob, upload.path.split("/").pop() || "cover.webp");

        const uploaded = await apiFetch(`/posts/${upload.postId}/cover`, {
          method: "POST",
          body: form,
        });
        if (!uploaded.ok) {
          throw new Error(await readApiError(uploaded, "Не удалось загрузить обложку"));
        }
        ({ version } = (await uploaded.json()) as { version: string });
      }

      // 3. Снапшот уезжает в репозиторий, дальше пересобирается статика.
      const published = await apiFetch("/posts/publish", { method: "POST" });
      if (!published.ok) {
        throw new Error(await readApiError(published, "Не удалось опубликовать"));
      }
      const result = (await published.json()) as {
        published: boolean;
        reason?: string;
        commitUrl?: string;
        buildUrl?: string;
      };

      return {
        version,
        changeUrl: result.commitUrl,
        buildUrl: result.buildUrl,
        warning: result.published ? undefined : result.reason,
      };
    },
  };
}

/**
 * Реализация `ServicesApi` поверх собственного API.
 *
 * Публикация здесь в два шага, как у кейсов и статей: сначала каталог целиком
 * уходит в базу, потом отдельной командой — снапшот в репозиторий. Если второй
 * шаг не прошёл (серверу не выдан доступ к GitHub), правки уже сохранены, и
 * панель показывает предупреждение вместо красного сбоя — терять сделанное
 * из-за настроек публикации нельзя.
 */
export function httpServicesApi(): ServicesApi {
  return {
    sourceLabel: "база данных",

    async load() {
      const response = await apiFetch("/service-catalog");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Не удалось загрузить каталог"));
      }
      return (await response.json()) as ServiceCatalog & { version: string };
    },

    async publish(input: ServicesPublishInput): Promise<ServicesPublishResult> {
      const saved = await apiFetch("/service-catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: input.categories,
          services: input.services,
          version: input.baseVersion,
        }),
      });
      if (!saved.ok) {
        throw new Error(await readApiError(saved, "Не удалось сохранить каталог"));
      }
      const body = (await saved.json()) as { version: string };

      const published = await apiFetch("/service-catalog/publish", { method: "POST" });
      if (!published.ok) {
        return {
          version: body.version,
          warning: await readApiError(
            published,
            "Каталог сохранён, но опубликовать не удалось",
          ),
        };
      }

      const result = (await published.json()) as {
        published: boolean;
        reason?: string;
        commitUrl?: string;
        buildUrl?: string;
      };

      return {
        version: body.version,
        changeUrl: result.commitUrl,
        buildUrl: result.buildUrl,
        warning: result.published ? undefined : result.reason,
      };
    },
  };
}
