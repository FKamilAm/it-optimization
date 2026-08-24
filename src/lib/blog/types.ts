/**
 * Форма одной статьи блога. Совпадает с таблицей `posts` из
 * `server/prisma/schema.prisma`: когда статья приезжает из базы, тип остаётся
 * тем же, меняется только источник.
 *
 * Раньше статьи жили в двух местах сразу — метаданные в константе
 * `BLOG_POSTS`, а текст в каталоге `messages/ru.json`. Так их нельзя было
 * править из панели: каталог грузится на каждой публичной странице, и класть
 * туда редактируемый контент значило бы тащить тело всех статей в бандл
 * главной. Теперь статья — данные, ровно как кейс.
 */
export interface BlogSection {
  heading: string;
  /** Абзацы. Хранятся списком, а не одной строкой с переносами. */
  body: string[];
}

export interface BlogPost {
  /** Вечный идентификатор. Переживает переименование slug. */
  id: string;
  /** Адрес статьи: /blog/<slug>/. Участвует в имени файла обложки. */
  slug: string;
  title: string;
  /** Короткое описание для карточки в списке. */
  excerpt: string;
  /** Рубрика — плашка на обложке и в хлебных крошках. */
  category: string;
  /** Вводный абзац под заголовком. */
  lead: string;
  metaTitle: string;
  metaDescription: string;
  /** Обложка 16:10. Старые статьи носят рисованные SVG, новые — WebP из панели. */
  cover: string;
  /** Время чтения в минутах. Панель подставляет расчёт, но его можно поправить. */
  readingTime: number;
  sections: BlogSection[];
  /** Блок «Коротко» в конце. Может быть пустым. */
  takeaways: string[];
  /**
   * Ключи услуг (`SERVICE_PAGES`), о которых статья. Связь двусторонняя: в
   * конце статьи из них собирается блок услуг, а на странице услуги — блок
   * статей. Раньше это была отдельная карта в константах, но карту нельзя
   * править из панели, а два списка (статья → услуги и услуга → статьи) рано
   * или поздно разошлись бы.
   */
  services: string[];
  /** Дата публикации, YYYY-MM-DD. Показывается в карточке и уезжает в JSON-LD. */
  publishedAt: string;
  /** ISO-даты. Проставляются панелью. `updatedAt` кормит sitemap. */
  createdAt: string;
  updatedAt: string;
}

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/**
 * «2026-07-18» → «18 июля 2026». Дата выводится, а не хранится второй строкой:
 * пока их было две, ничто не мешало им разъехаться, а в панели пришлось бы
 * просить владельца писать месяц словом.
 */
export function formatPostDate(publishedAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(publishedAt.slice(0, 10));
  if (!match) return publishedAt;
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} мин`;
}

/**
 * Оценка времени чтения. 150 слов в минуту — на существующих статьях это
 * попадает в то, что было проставлено руками (13/12/14 минут), а длинный текст
 * с техническими вставками читается медленнее среднего.
 */
export function estimateReadingTime(
  post: Pick<BlogPost, "lead" | "sections" | "takeaways">,
): number {
  const words = [
    post.lead,
    ...post.sections.flatMap((section) => [section.heading, ...section.body]),
    ...post.takeaways,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 150));
}

/** Статьи одной услуги — в общем порядке блога. */
export function postsForService(
  all: readonly BlogPost[],
  serviceKey: string,
): BlogPost[] {
  return all.filter((post) => post.services.includes(serviceKey));
}

/** Все статьи, кроме открытой, — блок «Читайте также». */
export function otherPosts(all: readonly BlogPost[], slug: string): BlogPost[] {
  return all.filter((post) => post.slug !== slug);
}

/** Сколько статей у каждой услуги. Статья с несколькими услугами считается в каждой. */
export function countPostsByService(all: readonly BlogPost[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const post of all) {
    for (const service of post.services) {
      counts[service] = (counts[service] ?? 0) + 1;
    }
  }
  return counts;
}
