/**
 * Форма одного кейса. Совпадает с таблицей `cases` из `prisma/schema.prisma`
 * (см. docs/backend.md): когда появится база, тип останется тем же, поменяется
 * только источник данных.
 */
export interface CaseItem {
  /** Вечный идентификатор. Переживает переименование slug. */
  id: string;
  /** Участвует в именах файлов и в ссылках со страниц услуг. */
  slug: string;
  title: string;
  description: string;
  quote: string;
  tags: string[];
  /**
   * Ключи услуг (`SERVICE_PAGES`), на страницах которых показывается кейс, и по
   * которым он фильтруется в каталоге. Кейс может относиться к нескольким
   * услугам сразу. Раньше эта связь жила в каталоге текстов, у каждой страницы
   * услуги; теперь она свойство кейса — иначе её нельзя было бы править из
   * панели.
   */
  services: string[];
  /** Квадратная обложка карточки (1000×1000). */
  cover: string;
  /** Широкий слайд для лайтбокса на десктопе (16:9). */
  detail: string;
  /** Вертикальный вариант слайда, чтобы целиком влезал в телефон (9:16). */
  detailMobile: string;
  /** ISO-даты. Проставляются панелью при публикации. */
  createdAt: string;
  updatedAt: string;
}

/** Сколько кейсов показывает главная, прежде чем увести на /proekty. */
export const HOME_CASE_COUNT = 3;

/**
 * Разделитель тегов в вёрстке — теги хранятся списком, а показываются строкой.
 * Middle dot (U+00B7), ровно как было, когда теги были одной строкой.
 */
export const TAG_SEPARATOR = " · ";

export function formatTags(tags: string[]): string {
  return tags.join(TAG_SEPARATOR);
}

/**
 * Выбрать кейсы по slug с сохранением порядка ссылок. Неизвестные slug
 * молча пропускаются: удалённый в /admin кейс не должен ронять сборку.
 */
export function pickCases(
  all: readonly CaseItem[],
  slugs: readonly string[],
): CaseItem[] {
  const bySlug = new Map(all.map((item) => [item.slug, item]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is CaseItem => Boolean(item));
}

/** Кейсы одной услуги — в общем порядке каталога. */
export function casesForService(
  all: readonly CaseItem[],
  serviceKey: string,
): CaseItem[] {
  return all.filter((item) => item.services.includes(serviceKey));
}

/** Сколько кейсов у каждой услуги. Кейс с несколькими услугами считается в каждой. */
export function countCasesByService(all: readonly CaseItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of all) {
    for (const service of item.services) {
      counts[service] = (counts[service] ?? 0) + 1;
    }
  }
  return counts;
}
