import servicesData from "../../../content/services.json";
import type { ServicePage } from "./types";

/**
 * Единственная точка чтения страниц услуг. Сегодня за ней JSON-файл, завтра —
 * PostgreSQL (см. docs/backend.md): подменяется реализация, вызывающий код не
 * меняется. Методы асинхронные намеренно — как у `CaseRepository`.
 *
 * Импортировать этот модуль можно только из серверных компонентов: он тянет за
 * собой весь `content/services.json`. Клиентским нужен `import type` из
 * `./types` — тексты приходят к ним пропсом, по одной услуге на страницу.
 */
export interface ServicePageRepository {
  /** Все услуги в порядке каталога. */
  list(): Promise<ServicePage[]>;
  byKey(key: string): Promise<ServicePage | undefined>;
  bySlug(slug: string): Promise<ServicePage | undefined>;
}

/**
 * Реализация поверх `content/services.json`. Файл попадает в бандл на этапе
 * сборки, поэтому статический экспорт остаётся полностью предрендеренным.
 */
class JsonServicePageRepository implements ServicePageRepository {
  private readonly items = servicesData as ServicePage[];

  async list(): Promise<ServicePage[]> {
    return this.items;
  }

  async byKey(key: string): Promise<ServicePage | undefined> {
    return this.items.find((page) => page.key === key);
  }

  async bySlug(slug: string): Promise<ServicePage | undefined> {
    return this.items.find((page) => page.slug === slug);
  }
}

export const servicePageRepository: ServicePageRepository =
  new JsonServicePageRepository();
