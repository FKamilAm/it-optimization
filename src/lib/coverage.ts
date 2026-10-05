import servicesEn from "../../content/translations/services.en.json";
import servicesEs from "../../content/translations/services.es.json";
import casesEn from "../../content/translations/cases.en.json";
import casesEs from "../../content/translations/cases.es.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/**
 * Что уже переведено, а что ещё нет.
 *
 * Нужно ровно для одного: не отдавать поисковику страницу, которая объявлена
 * английской (`lang="en"`, hreflang, строка в карте сайта), а внутри русская.
 * Несовпадение языка страницы с заявленным Google считает признаком низкого
 * качества, и достаётся за это не только самой странице.
 *
 * Поэтому непереведённая страница продолжает открываться — по прямой ссылке
 * её можно показать и вычитать, — но уходит с `robots: noindex` и выпадает из
 * карты сайта. Замок снимается сам, как только появляется перевод: отдельного
 * списка «что уже можно индексировать» нет, и забыть его обновить нельзя.
 *
 * Проверяется наличие перевода, а не его полнота: перевод накладывается
 * полями, и запись в таблице означает, что страницу переводили осознанно.
 */

const SERVICES: Partial<Record<Locale, Record<string, unknown>>> = {
  en: servicesEn,
  es: servicesEs,
};

const CASES: Partial<Record<Locale, Record<string, unknown>>> = {
  en: casesEn,
  es: casesEs,
};

/** Русская версия переведена по определению. */
export function isServiceTranslated(key: string, locale: Locale): boolean {
  return locale === DEFAULT_LOCALE || Boolean(SERVICES[locale]?.[key]);
}

export function isCaseTranslated(slug: string, locale: Locale): boolean {
  return locale === DEFAULT_LOCALE || Boolean(CASES[locale]?.[slug]);
}

/**
 * Статьи блога и политика пока не переводились вовсе. Когда появятся
 * переводы, здесь будет такая же проверка по таблице, а не правка по месту.
 */
export function isPostTranslated(_slug: string, locale: Locale): boolean {
  return locale === DEFAULT_LOCALE;
}

export function isPrivacyTranslated(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE;
}
