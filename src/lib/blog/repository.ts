import postsData from "../../../content/blog.json";
import type { BlogPost } from "./types";

/**
 * Единственная точка чтения статей. Сегодня за ней JSON-файл, завтра —
 * PostgreSQL (см. docs/backend.md): подменяется реализация, вызывающий код не
 * меняется. Методы асинхронные намеренно — как у `CaseRepository`.
 */
export interface BlogRepository {
  /** Все статьи в порядке показа в блоге. */
  list(): Promise<BlogPost[]>;
  bySlug(slug: string): Promise<BlogPost | undefined>;
}

/**
 * Реализация поверх `content/blog.json`. Файл попадает в бандл на этапе
 * сборки, поэтому статический экспорт остаётся полностью предрендеренным.
 */
class JsonBlogRepository implements BlogRepository {
  private readonly items = postsData as BlogPost[];

  async list(): Promise<BlogPost[]> {
    return this.items;
  }

  async bySlug(slug: string): Promise<BlogPost | undefined> {
    return this.items.find((post) => post.slug === slug);
  }
}

export const blogRepository: BlogRepository = new JsonBlogRepository();
