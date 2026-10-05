/**
 * Языки сайта.
 *
 * Русский — язык по умолчанию и живёт в корне (`/`, `/uslugi/…`): сайт уже
 * проиндексирован, и перенос существующих адресов под `/ru/` обнулил бы выдачу.
 * Остальные языки получают префикс (`/en/…`, `/es/…`).
 *
 * Переставить русский под префикс позже будет нельзя: редирект делать нечем —
 * хостинг отдаёт статику через nginx, `.htaccess` там игнорируется, а своего
 * рантайма у сайта нет. Поэтому схема адресов выбирается один раз.
 */
export const LOCALES = ["ru", "en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

/** Языки с префиксом в адресе — всё, кроме языка по умолчанию. */
export const PREFIXED_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
) as Exclude<Locale, typeof DEFAULT_LOCALE>[];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Название языка на нём самом — так его узнают те, кто не читает по-русски.
 * Для переключателя языков.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  es: "Español",
};

/** Код для атрибута `lang` и для `hreflang`. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  ru: "ru",
  en: "en",
  es: "es",
};

/** Локаль для `Intl` и OpenGraph (`og:locale`). */
export const LOCALE_OG: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
  es: "es_ES",
};

/**
 * Префикс пути для локали: «» для русского, «/en» и «/es» для остальных.
 * Единственное место, где это знание записано, — всё остальное зовёт `localePath()`.
 */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/**
 * Внутренняя ссылка с учётом языка. На вход — путь русской версии («/uslugi/»),
 * на выход — он же с префиксом нужной локали.
 *
 * Завершающий слэш обязателен: `trailingSlash: true` в next.config.ts, и без
 * него статика на хостинге отдаёт редирект лишним запросом.
 */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefixed = `${localePrefix(locale)}${normalized}`;
  return prefixed === "" ? "/" : prefixed;
}
