import en from "../../../content/translations/services.en.json";
import es from "../../../content/translations/services.es.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { applyPrices, localizePrice } from "@/lib/money";
import type { ServicePage } from "./types";

/**
 * Переводы страниц услуг.
 *
 * Отдельными файлами, как у кейсов и слугов, и по той же причине: форму
 * `content/services.json` повторяют типы и будущая таблица, а перевод —
 * свойство перевода, а не контента.
 *
 * Перевод накладывается полями: чего нет — остаётся русским. Так тридцать две
 * страницы можно переводить партиями, не ломая сайт на каждом шаге: уже
 * переведённые открываются на своём языке, остальные — на русском, но
 * открываются.
 *
 * `recommended` у тарифа и `key`/`slug` не переводятся вовсе: первое —
 * признак, остальное — идентификаторы. Поэтому тариф собирается из русского
 * объекта с наложением текстовых полей, а не заменяется целиком — иначе
 * «Популярный» слетел бы с того тарифа, на котором стоит.
 */

interface Titled {
  title: string;
  text: string;
}

interface Faq {
  question: string;
  answer: string;
}

/**
 * Цены в переводе НЕТ намеренно: она выводится из рублёвой по курсу ЦБ.
 * Второй список цен рано или поздно разойдётся с первым, и клиенту покажут
 * не то, что обещает прайс.
 */
interface TariffText {
  name: string;
  deadline: string;
  features: string[];
}

interface ServiceTranslation {
  metaTitle?: string;
  metaDescription?: string;
  breadcrumb?: string;
  h1?: string;
  lead?: string;
  includes?: string[];
  forWhom?: Titled[];
  steps?: Titled[];
  faq?: Faq[];
  tariffs?: TariffText[];
}

const TABLES: Partial<Record<Locale, Record<string, ServiceTranslation>>> = {
  en: en as Record<string, ServiceTranslation>,
  es: es as Record<string, ServiceTranslation>,
};

export function translateServicePage(page: ServicePage, locale: Locale): ServicePage {
  if (locale === DEFAULT_LOCALE) return page;
  const t = TABLES[locale]?.[page.key];
  if (!t) return page;

  // Цены стоят и посреди текста — в описании для поиска и в ответах FAQ.
  // В переводе они помечены как {price:120000}, здесь метка превращается в
  // сумму нужной валюты.
  const text = (value: string) => applyPrices(value, locale);

  return {
    ...page,
    metaTitle: text(t.metaTitle ?? page.metaTitle),
    metaDescription: text(t.metaDescription ?? page.metaDescription),
    breadcrumb: t.breadcrumb ?? page.breadcrumb,
    h1: t.h1 ?? page.h1,
    lead: text(t.lead ?? page.lead),
    includes: (t.includes ?? page.includes).map(text),
    forWhom: t.forWhom ?? page.forWhom,
    steps: t.steps ?? page.steps,
    faq: (t.faq ?? page.faq).map((item) => ({
      question: item.question,
      answer: text(item.answer),
    })),
    // Тариф собирается наложением: признак «Популярный» живёт в русском
    // объекте и не должен зависеть от того, перевели его уже или нет.
    // Цена всегда из русского тарифа, переведённая в валюту локали: один
    // источник правды. Перевод задаёт только название, срок и состав.
    tariffs: page.tariffs?.map((tariff, index) => ({
      ...tariff,
      ...(t.tariffs?.[index] ?? {}),
      price: localizePrice(tariff.price, locale),
    })),
  };
}

export function translateServicePages(
  pages: ServicePage[],
  locale: Locale,
): ServicePage[] {
  if (locale === DEFAULT_LOCALE) return pages;
  return pages.map((page) => translateServicePage(page, locale));
}
