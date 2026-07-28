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
