import en from "../../../content/translations/cases.en.json";
import es from "../../../content/translations/cases.es.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { CaseItem } from "./types";

/**
 * Переводы кейсов.
 *
 * Лежат отдельными файлами, а не полями внутри `content/cases.json`, и это
 * то же решение, что у слугов: форму `cases.json` повторяет таблица `cases` в
 * PostgreSQL, и её правит /panel. Добавить туда `titleEn` значило бы менять
 * схему, сид и панель — а перевод принадлежит переводу, а не контенту.
 *
 * Переводится только то, что человек читает: заголовок, описание, цитата
 * клиента и теги. Всё остальное — слуг, картинки, ключи услуг, даты — одно на
 * все языки, потому что это идентификаторы и файлы, а не текст.
 */

interface CaseTranslation {
  title: string;
  description: string;
  quote: string;
  tags: string[];
}

const TABLES: Partial<Record<Locale, Record<string, CaseTranslation>>> = {
  en: en as Record<string, CaseTranslation>,
  es: es as Record<string, CaseTranslation>,
};

/**
 * Кейс на нужном языке. Перевода нет — возвращается русский: страница должна
 * открыться и показать работу, пусть и не на том языке. Пустая карточка
 * выглядит как поломка, русский текст — как незаконченный перевод.
 */
export function translateCase(item: CaseItem, locale: Locale): CaseItem {
  if (locale === DEFAULT_LOCALE) return item;
  const translation = TABLES[locale]?.[item.slug];
  if (!translation) return item;

  return {
    ...item,
    title: translation.title,
    description: translation.description,
    quote: translation.quote,
    tags: translation.tags,
  };
}

export function translateCases(items: CaseItem[], locale: Locale): CaseItem[] {
  if (locale === DEFAULT_LOCALE) return items;
  return items.map((item) => translateCase(item, locale));
}
