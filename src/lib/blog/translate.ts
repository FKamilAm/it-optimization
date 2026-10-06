import en from "../../../content/translations/blog.en.json";
import es from "../../../content/translations/blog.es.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { applyPrices } from "@/lib/money";
import type { BlogPost, BlogSection } from "./types";

/**
 * Переводы статей блога.
 *
 * Отдельными файлами, а не полями внутри `content/blog.json`, — то же решение,
 * что у кейсов и услуг: форму `blog.json` повторяет таблица `posts` в
 * PostgreSQL, и её правит /panel. Перевод принадлежит переводу, а не контенту.
 *
 * Переводится только то, что человек читает. Слуг (он же идентификатор),
 * даты, время чтения и связь с услугами — одни на все языки. Обложка тоже
 * общая, кроме случая, когда на ней нарисован текст: тогда перевод задаёт
 * свою (`cover`), иначе английский читатель увидит русские надписи.
 *
 * Суммы в переводе записаны метками `{price:150000}`: доллары считаются из
 * рублей по курсу ЦБ на момент сборки, как на страницах услуг, — второй
 * список цен однажды разошёлся бы с первым.
 *
 * Правка статьи в панели переводы не трогает: переведённая версия остаётся
 * прежней, пока её не обновят здесь. scripts/check-translations.mjs ловит
 * расхождение по числу разделов и абзацев.
 */

interface PostTranslation {
  title: string;
  excerpt: string;
  /** Своя обложка — только если на общей нарисован русский текст. */
  cover?: string;
  category: string;
  lead: string;
  metaTitle: string;
  metaDescription: string;
  sections: BlogSection[];
  takeaways: string[];
}

export const BLOG_TRANSLATIONS: Partial<Record<Locale, Record<string, PostTranslation>>> =
  {
    en: en as Record<string, PostTranslation>,
    es: es as Record<string, PostTranslation>,
  };

/** Статья на нужном языке. Перевода нет — остаётся русская, но открывается. */
export function translatePost(post: BlogPost, locale: Locale): BlogPost {
  if (locale === DEFAULT_LOCALE) return post;
  const t = BLOG_TRANSLATIONS[locale]?.[post.slug];
  if (!t) return post;

  const text = (value: string) => applyPrices(value, locale);

  return {
    ...post,
    title: text(t.title),
    excerpt: text(t.excerpt),
    cover: t.cover ?? post.cover,
    category: t.category,
    lead: text(t.lead),
    metaTitle: text(t.metaTitle),
    metaDescription: text(t.metaDescription),
    sections: t.sections.map((section) => ({
      heading: text(section.heading),
      body: section.body.map(text),
    })),
    takeaways: t.takeaways.map(text),
  };
}

export function translatePosts(posts: BlogPost[], locale: Locale): BlogPost[] {
  if (locale === DEFAULT_LOCALE) return posts;
  return posts.map((post) => translatePost(post, locale));
}
