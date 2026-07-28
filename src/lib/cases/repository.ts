import casesData from "../../../content/cases.json";
import { pickCases, type CaseItem } from "./types";

/**
 * Единственная точка чтения кейсов. Сегодня за ней JSON-файл, завтра —
 * PostgreSQL через Prisma (см. docs/backend.md): подменяется реализация,
 * вызывающий код не меняется.
 *
 * Методы асинхронные намеренно, хотя JSON-реализация отвечает мгновенно —
 * иначе при переходе на базу пришлось бы править каждый вызов.
 */
export interface CaseRepository {
  /** Все кейсы в порядке показа на сайте. */
  list(): Promise<CaseItem[]>;
  /** Первые несколько — витрина на главной. */
  listFeatured(limit: number): Promise<CaseItem[]>;
  bySlug(slug: string): Promise<CaseItem | undefined>;
  /** Кейсы, на которые ссылается страница услуги, в порядке ссылок. */
  bySlugs(slugs: readonly string[]): Promise<CaseItem[]>;
}

/**
 * Реализация поверх `content/cases.json`. Файл попадает в бандл на этапе
 * сборки, поэтому статический экспорт остаётся полностью предрендеренным.
 */
class JsonCaseRepository implements CaseRepository {
  private readonly items = casesData as CaseItem[];

  async list(): Promise<CaseItem[]> {
    return this.items;
  }

  async listFeatured(limit: number): Promise<CaseItem[]> {
    return this.items.slice(0, limit);
  }

  async bySlug(slug: string): Promise<CaseItem | undefined> {
    return this.items.find((item) => item.slug === slug);
  }

  async bySlugs(slugs: readonly string[]): Promise<CaseItem[]> {
    return pickCases(this.items, slugs);
  }
}

export const caseRepository: CaseRepository = new JsonCaseRepository();
