import catalog from "../../content/service-catalog.json";
import slugs from "../../content/slugs.json";
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from "./config";

/**
 * Адреса разделов и страниц на трёх языках.
 *
 * Английский и испанский получают свои слуги, а не транслит русских:
 * `/en/services/corporate-website/`, а не
 * `/en/uslugi/razrabotka-korporativnogo-sajta/`. Слуг — сигнал для поисковика,
 * и кириллица в латинице этим сигналом быть перестаёт.
 *
 * Переименовать их после публикации будет нельзя: редирект делать нечем —
 * хостинг отдаёт статику через nginx, `.htaccess` там не читается, рантайма у
 * сайта нет. Поэтому слуги сочиняются один раз, до выкладки.
 *
 * Русские слуги берутся оттуда же, где лежали всегда (каталог услуг и
 * `content/blog.json`), а переводы — из `content/slugs.json`. Форма тех двух
 * файлов не менялась намеренно: их правит /panel и повторяет схема
 * PostgreSQL, и ломать этот контракт ради локализации адресов не стоит.
 */

type Translations = Record<string, Partial<Record<Locale, string>>>;

const SERVICE_SLUGS = slugs.services as Translations;
const POST_SLUGS = slugs.posts as Translations;

const RU_SERVICE_SLUG: Record<string, string> = Object.fromEntries(
  catalog.services.map((service) => [service.key, service.slug]),
);

/** Сегменты разделов. Русские — те, что уже проиндексированы, менять нельзя. */
export const SEGMENTS = {
  services: { ru: "uslugi", en: "services", es: "servicios" },
  projects: { ru: "proekty", en: "projects", es: "proyectos" },
  blog: { ru: "blog", en: "blog", es: "blog" },
  privacy: {
    ru: "politika-konfidencialnosti",
    en: "privacy-policy",
    es: "politica-de-privacidad",
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type Section = keyof typeof SEGMENTS;

export function segment(section: Section, locale: Locale): string {
  return SEGMENTS[section][locale];
}

/** Слуг услуги в нужной локали. Нет перевода — остаётся русский, страница не пропадает. */
export function serviceSlug(key: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return RU_SERVICE_SLUG[key] ?? key;
  return SERVICE_SLUGS[key]?.[locale] ?? RU_SERVICE_SLUG[key] ?? key;
}

/** Слуг статьи. На вход — русский слуг, он же идентификатор статьи в данных. */
export function postSlug(ruSlug: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return ruSlug;
  return POST_SLUGS[ruSlug]?.[locale] ?? ruSlug;
}

/** Обратный разбор: слуг из адреса → ключ услуги. Нужен маршруту. */
export function serviceKeyBySlug(slug: string, locale: Locale): string | undefined {
  if (locale === DEFAULT_LOCALE) {
    return catalog.services.find((service) => service.slug === slug)?.key;
  }
  const entry = Object.entries(SERVICE_SLUGS).find(
    ([, translations]) => translations[locale] === slug,
  );
  return entry?.[0] ?? catalog.services.find((service) => service.slug === slug)?.key;
}

/** Обратный разбор для статьи: слуг из адреса → русский слуг (идентификатор). */
export function postRuSlugBySlug(slug: string, locale: Locale): string | undefined {
  if (locale === DEFAULT_LOCALE) return slug;
  const entry = Object.entries(POST_SLUGS).find(
    ([, translations]) => translations[locale] === slug,
  );
  return entry?.[0] ?? slug;
}

// ------------------------------------------------------------------ Пути

export const homePath = (locale: Locale) => localePath(locale, "/");

export const servicesPath = (locale: Locale) =>
  localePath(locale, `/${segment("services", locale)}/`);

export const servicePath = (key: string, locale: Locale) =>
  localePath(locale, `/${segment("services", locale)}/${serviceSlug(key, locale)}/`);

export const projectsPath = (locale: Locale) =>
  localePath(locale, `/${segment("projects", locale)}/`);

export const blogPath = (locale: Locale) =>
  localePath(locale, `/${segment("blog", locale)}/`);

export const postPath = (ruSlug: string, locale: Locale) =>
  localePath(locale, `/${segment("blog", locale)}/${postSlug(ruSlug, locale)}/`);

export const privacyPath = (locale: Locale) =>
  localePath(locale, `/${segment("privacy", locale)}/`);

/**
 * Все адреса одной страницы — для hreflang: поисковику надо сказать, что
 * `/uslugi/razrabotka-crm/` и `/en/services/crm-development/` это одна
 * страница на разных языках, а не два разных документа.
 */
export function alternates(build: (locale: Locale) => string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, build(locale)])) as Record<
    Locale,
    string
  >;
}
