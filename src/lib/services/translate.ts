import en from "../../../content/translations/services.en.json";
import es from "../../../content/translations/services.es.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
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

interface TariffText {
  name: string;
  price: string;
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

  return {
    ...page,
    metaTitle: t.metaTitle ?? page.metaTitle,
    metaDescription: t.metaDescription ?? page.metaDescription,
    breadcrumb: t.breadcrumb ?? page.breadcrumb,
    h1: t.h1 ?? page.h1,
    lead: t.lead ?? page.lead,
    includes: t.includes ?? page.includes,
    forWhom: t.forWhom ?? page.forWhom,
    steps: t.steps ?? page.steps,
    faq: t.faq ?? page.faq,
    // Тариф собирается наложением: признак «Популярный» живёт в русском
    // объекте и не должен зависеть от того, перевели его уже или нет.
    tariffs: page.tariffs?.map((tariff, index) => {
      const text = t.tariffs?.[index];
      return text ? { ...tariff, ...text } : tariff;
    }),
  };
}

export function translateServicePages(
  pages: ServicePage[],
  locale: Locale,
): ServicePage[] {
  if (locale === DEFAULT_LOCALE) return pages;
  return pages.map((page) => translateServicePage(page, locale));
}
