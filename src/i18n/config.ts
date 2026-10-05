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
 * Где лежит выбранный язык. Один ключ на двоих: его пишет переключатель и
 * читает скрипт автоопределения — иначе выбранный руками язык сбрасывался бы
 * при следующем заходе.
 */
export const LOCALE_STORAGE_KEY = "itopt-locale";

/**
 * Разбирает путь на локаль и остаток без префикса.
 * «/en/uslugi/» → { locale: "en", path: "/uslugi/" }
 * «/uslugi/»    → { locale: "ru", path: "/uslugi/" }
 */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    const rest = `/${segments.slice(1).join("/")}`;
    return { locale: first, path: rest === "/" ? "/" : `${rest}/` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
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

/**
 * Название компании на языке страницы.
 *
 * Шаблон заголовка дописывает его к каждому title, и по-русски это
 * «Айти-Оптимизация». На английской странице такая приписка выглядит как
 * сбой кодировки, а не как бренд, поэтому имя тоже локализуется — ровно так
 * оно и записано в переведённых каталогах строк.
 *
 * Юридическое наименование (ООО «ИТ ОПТИМИЗАЦИЯ») этим не затрагивается: оно
 * живёт в `ORG` и остаётся русским на всех языках, потому что это реквизит, а
 * не маркетинговое название.
 */
export const BRAND_NAME: Record<Locale, string> = {
  ru: "Айти-Оптимизация",
  en: "IT Optimization",
  es: "IT Optimization",
};

/**
 * Включено ли автоопределение языка по языку браузера.
 *
 * Выключено, пока переведена не вся витрина. Посетитель, которого увели на
 * /es/ и который через два клика упёрся в русский текст, решает, что сломан
 * сайт, — а тот, кто остался на русской версии, просто видит русский сайт и
 * понимает про него всё сразу. Второе честнее.
 *
 * Переключатель языков при этом работает всегда: выбрать язык руками можно и
 * сейчас, и выбор запомнится.
 *
 * Включать, когда страницы услуг и статьи будут переведены целиком.
 */
export const AUTO_DETECT_LOCALE = false;
