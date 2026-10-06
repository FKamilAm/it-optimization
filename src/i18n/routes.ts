import catalog from "../../content/service-catalog.json";
import slugs from "../../content/slugs.json";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localePath,
  splitLocalePath,
  type Locale,
} from "./config";

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

export const SECTIONS = Object.keys(SEGMENTS) as Section[];

/**
 * Обратный разбор: сегмент из адреса → раздел.
 *
 * Нужен, потому что в маршрутах `/en/services/` и `/es/servicios/` второй
 * сегмент разный, а статическая папка в App Router одна на все локали.
 * Значит сегмент приходится делать динамическим, а разделы различать здесь.
 */
export function sectionBySegment(value: string, locale: Locale): Section | undefined {
  return SECTIONS.find((section) => SEGMENTS[section][locale] === value);
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

/** Страница 403: /403/, /en/403/, /es/403/ — см. views/forbidden-page.tsx. */
export const FORBIDDEN_SEGMENT = "403";
export const forbiddenPath = (locale: Locale) =>
  localePath(locale, `/${FORBIDDEN_SEGMENT}/`);

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

// ------------------------------------------------- Перевод адреса на другой язык

/** Что за страница перед нами. `unknown` — всё, чему перевода нет (например /panel/). */
type Resolved =
  | { kind: "home" }
  | { kind: "section"; section: Section }
  | { kind: "service"; key: string }
  | { kind: "post"; ruSlug: string }
  | { kind: "forbidden" }
  | { kind: "unknown" };

/**
 * Разбирает адрес в описание страницы, не привязанное к языку.
 *
 * Нужно переключателю языков. Снять префикс локали недостаточно: у разделов
 * и страниц свои слуги в каждом языке, и `/en/services/crm-development/` без
 * перевода превращается в `/services/crm-development/` — адрес, которого не
 * существует. Ровно так переключатель и ломался везде, кроме главной.
 */
export function resolvePath(pathname: string): { locale: Locale; page: Resolved } {
  const { locale, path } = splitLocalePath(pathname);
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) return { locale, page: { kind: "home" } };
  // Страница 403 — один адрес на все языки, без перевода сегмента.
  if (parts.length === 1 && parts[0] === FORBIDDEN_SEGMENT) {
    return { locale, page: { kind: "forbidden" } };
  }

  const section = sectionBySegment(parts[0], locale);
  if (!section) return { locale, page: { kind: "unknown" } };
  if (parts.length === 1) return { locale, page: { kind: "section", section } };

  if (section === "services") {
    const key = serviceKeyBySlug(parts[1], locale);
    return { locale, page: key ? { kind: "service", key } : { kind: "unknown" } };
  }
  if (section === "blog") {
    const ruSlug = postRuSlugBySlug(parts[1], locale);
    return { locale, page: ruSlug ? { kind: "post", ruSlug } : { kind: "unknown" } };
  }
  return { locale, page: { kind: "unknown" } };
}

const SECTION_PATH: Record<Section, (locale: Locale) => string> = {
  services: servicesPath,
  projects: projectsPath,
  blog: blogPath,
  privacy: privacyPath,
};

/**
 * Тот же адрес на другом языке. Страница без перевода уводит на главную
 * нужного языка — это лучше, чем ссылка в 404.
 */
export function translatePath(pathname: string, target: Locale): string {
  const { page } = resolvePath(pathname);
  switch (page.kind) {
    case "home":
      return homePath(target);
    case "section":
      return SECTION_PATH[page.section](target);
    case "service":
      return servicePath(page.key, target);
    case "post":
      return postPath(page.ruSlug, target);
    case "forbidden":
      return forbiddenPath(target);
    default:
      return homePath(target);
  }
}
