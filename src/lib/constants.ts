import serviceCatalog from "../../content/service-catalog.json";
import categoryTranslations from "../../content/translations/service-categories.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

export const SITE = {
  name: "Айти-Оптимизация",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@itoptimizations.ru",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+79937266061",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/dujaii",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/79963266161",
  // NOTE: MAX has no phone-based chat links — set this to a MAX profile/bot link.
  max: process.env.NEXT_PUBLIC_MAX_URL ?? "https://max.ru/",
} as const;

/**
 * Профили компании на внешних площадках — для `sameAs` в микроразметке.
 *
 * `sameAs` говорит поисковику, что сайт, организация и эти страницы — одна и та
 * же сущность, а не однофамильцы. Пополнять по мере регистрации в каталогах;
 * тексты для профилей лежат в docs/katalogi.md.
 *
 * Ссылки без UTM: метки нужны площадке для своей статистики, а в разметке
 * важен канонический адрес профиля.
 */
export const PROFILES = {
  telegram: "https://t.me/dujaii",
  workspace: "https://workspace.ru/contractors/it-optimizaciya/",
} as const;

export const ORG = {
  legalName: "ООО «ИТ ОПТИМИЗАЦИЯ»",
  inn: "8600002653",
  kpp: "860001001",
  ogrn: "1268600004463",
  address:
    "628162, Ханты-Мансийский - Югра автономный округ, Белоярский р-н, г. Белоярский, ул. Молодости, д. 1, кв. 68",
  /** Тот же адрес по частям — для PostalAddress в микроразметке. */
  postal: {
    streetAddress: "ул. Молодости, д. 1, кв. 68",
    addressLocality: "Белоярский",
    addressRegion: "Ханты-Мансийский автономный округ — Югра",
  },
  phone: "+7 996 326-61-61",
} as const;

/**
 * Название и адрес для /en/ и /es/ — по-английски на обеих: испанская версия
 * тоже показывает английские реквизиты, как их пишут в международных
 * документах. Название переведено, а не транслитерировано, — так же, как бренд
 * в логотипе и BRAND_NAME. Коды (ИНН, КПП, ОГРН) и телефон одни на все языки и
 * берутся из ORG.
 */
export const ORG_INTL = {
  legalName: "IT OPTIMIZATION LLC",
  address:
    "1 Molodosti St., apt. 68, Beloyarsky, Beloyarsky District, Khanty-Mansi Autonomous Okrug — Yugra, 628162, Russian Federation",
  postal: {
    streetAddress: "1 Molodosti St., apt. 68",
    addressLocality: "Beloyarsky",
    addressRegion: "Khanty-Mansi Autonomous Okrug — Yugra",
  },
} as const;

/** Реквизиты на языке страницы. */
export function orgFor(locale: Locale) {
  return locale === DEFAULT_LOCALE ? ORG : { ...ORG, ...ORG_INTL };
}

// Direct contact channels — the site links straight into a messenger / call /
// email instead of collecting personal data through a form.
//   action "link" — open the target directly (works well for Telegram / WhatsApp)
//   action "copy" — show a small popover with the value + "copy" button
//                   (better for phone, e-mail and MAX, which has no chat link)
// Labels live in the catalog (contact.channels.<key>), not here: «Телефон» on
// the English site was exactly a label hardcoded in this list.
export const CONTACT_CHANNELS = [
  {
    key: "telegram",
    value: "@dujaii",
    href: SITE.telegram,
    external: true,
    action: "link",
  },
  {
    key: "whatsapp",
    value: "+7 996 326-61-61",
    href: SITE.whatsapp,
    external: true,
    action: "link",
  },
  {
    key: "max",
    value: "+7 996 326-61-61",
    href: SITE.max,
    external: false,
    action: "copy",
  },
  {
    key: "phone",
    value: "+7 993 726-60-61",
    href: `tel:${SITE.phone}`,
    external: false,
    action: "copy",
  },
  {
    key: "email",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
    external: false,
    action: "copy",
  },
] as const;

export type ContactChannelKey = (typeof CONTACT_CHANNELS)[number]["key"];
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

// Telegram (username links) and WhatsApp support a pre-filled draft via `?text=`.
// Append the starter message so the chat opens with it already typed in.
export function withStarterMessage(
  key: ContactChannelKey,
  href: string,
  message?: string,
): string {
  if (!message || (key !== "telegram" && key !== "whatsapp")) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}text=${encodeURIComponent(message)}`;
}

export const TECHNOLOGIES = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "MongoDB",
  "Supabase",
  "Telegram API",
  "OpenAI / AI",
  "Blockchain / Web3",
  "Docker",
  "REST API",
  "GraphQL",
  "HTML5",
  "CSS3",
  "Tailwind",
  "Framer Motion",
] as const;

export const INDUSTRIES = [
  "FinTech",
  "E-Commerce",
  "Marketplace",
  "iGaming",
  "Web3",
  "Real Estate",
  "SaaS",
  "E-Learning",
  "Corporate Systems",
  "Healthcare",
  "Social Platforms",
] as const;

export const METRICS = [
  { valueKey: "metric1Value", labelKey: "metric1Label" },
  { valueKey: "metric2Value", labelKey: "metric2Label" },
  { valueKey: "metric3Value", labelKey: "metric3Label" },
] as const;

/**
 * Каталог услуг: разделы, их порядок, принадлежность услуг разделам и признак
 * черновика. Данные лежат в `content/service-catalog.json` и правятся из
 * /panel — поэтому здесь всё выводится из файла, а не пишется руками.
 *
 * Файл намеренно отделён от `content/services.json` с текстами страниц и
 * держится маленьким (единицы килобайт): его импортируют клиентские компоненты
 * — меню в хедере, карточка услуги, каталог — а тексты всех страниц в браузер
 * тащить нельзя.
 *
 * Два слуга в нём выглядят странно, и оба такие сознательно:
 *
 * - `security` — «audit-bezopasnosti-sajta», в единственном числе, потому что у
 *   статьи блога про ту же тему множественное. Пара разведена по интенту:
 *   статья отвечает «что это и как проходит», страница — «заказать, цена,
 *   сроки». Иначе они конкурировали бы за один запрос. Аудит всей компании —
 *   это отдельная услуга `infosecAudit`, а не расширение этой.
 * - `messenger` — совпадает со слугом статьи в /blog/. Услуга объединяет
 *   корпоративные, встроенные и клиентские мессенджеры, так что сузить её до
 *   «корпоративного» значило бы разойтись с собственным заголовком.
 */
interface ServiceCatalogEntry {
  key: string;
  slug: string;
  category: string;
  draft: boolean;
}

const CATALOG = serviceCatalog as {
  categories: { key: string; title: string }[];
  services: ServiceCatalogEntry[];
};

/** Разделы каталога в порядке показа. Раздел — фильтр на /uslugi/, не маршрут. */
export const SERVICE_CATEGORIES = CATALOG.categories;

const CATEGORY_TITLES = categoryTranslations as Record<
  string,
  Partial<Record<Locale, string>>
>;

/**
 * Название раздела на языке страницы. Русское живёт в каталоге и правится в
 * панели, переводы — в content/translations/service-categories.json. Раздел,
 * заведённый в панели без перевода, показывается по-русски: кнопка с русской
 * подписью лучше пропавшей кнопки.
 */
export function categoryTitle(key: string, locale: Locale): string {
  const ru = SERVICE_CATEGORIES.find((category) => category.key === key)?.title ?? key;
  return locale === DEFAULT_LOCALE ? ru : (CATEGORY_TITLES[key]?.[locale] ?? ru);
}

/**
 * Ключ услуги → слуг её страницы (/uslugi/…). Перечень всех страниц, включая
 * черновики: по нему `generateStaticParams` собирает маршруты.
 */
export const SERVICE_PAGES: Record<string, string> = Object.fromEntries(
  CATALOG.services.map((service) => [service.key, service.slug]),
);

/**
 * Услуги, страницы которых ещё пишутся.
 *
 * Черновик собирается и открывается по своему адресу — его можно смотреть и
 * править локально, — но не попадает ни в каталог, ни в меню, ни в карту сайта,
 * ни в микроразметку, а сама страница отдаётся с `noindex`. Иначе десяток
 * заготовок с ценой «по запросу» уехал бы на прод ближайшим push в main:
 * деплой здесь автоматический.
 *
 * Готовность услуги — это снятая галочка в панели.
 */
export const DRAFT_SERVICES: ReadonlySet<string> = new Set(
  CATALOG.services.filter((service) => service.draft).map((service) => service.key),
);

/**
 * Разделы без черновиков — то, из чего /uslugi/ строит кнопки фильтра.
 *
 * Раздел, в котором пока одни черновики, отбрасывается целиком: кнопка,
 * открывающая пустую сетку, читается как поломка. Появится первая готовая
 * страница — появится и раздел, сам собой.
 */
export const SERVICE_CATEGORY_NAV = SERVICE_CATEGORIES.map((category) => ({
  key: category.key,
  title: category.title,
  services: CATALOG.services
    .filter((service) => service.category === category.key && !service.draft)
    .map((service) => service.key),
})).filter((category) => category.services.length > 0);

/**
 * Плоский список опубликованных услуг в порядке каталога — для витрины на
 * главной, меню в хедере, фильтра на /proekty и микроразметки хаба.
 *
 * Выводится из тех же данных, что и разделы: два списка одних и тех же ключей
 * рано или поздно разошлись бы, и услуга тихо пропала бы из меню или из
 * каталога.
 */
export const SERVICE_NAV = SERVICE_CATEGORY_NAV.flatMap(({ services }) =>
  services.map((key) => ({ key, slug: SERVICE_PAGES[key] })),
);

// Что показывает главная в блоке «Популярные направления» — витрина, а не
// каталог: полный список услуг живёт на /uslugi/, куда ведёт кнопка над
// сеткой. Четыре ключа заполняют ровно один ряд на широком экране (xl:grid-cols-4).
// Порядок здесь и есть порядок карточек; менять состав можно свободно, ничего
// кроме этой витрины он не задевает.
export const HOME_SERVICE_KEYS = ["corporate", "platforms", "telegram", "ai"] as const;

/**
 * Что показывает выпадающее меню услуг в шапке — витрина, как и на главной.
 *
 * Полный список туда больше не помещается: после публикации инфраструктуры,
 * информационной безопасности и бизнес-систем услуг стало 32, и меню из
 * тридцати двух строк перестаёт быть навигацией — по нему невозможно скользить
 * глазами, а внизу экрана оно упирается в край. Двенадцать ключей заполняют
 * три колонки по четыре строки; за остальным ведут «Все услуги» внизу панели и
 * сам пункт «Услуги» в шапке — он теперь ссылка на каталог, а не только
 * переключатель меню.
 *
 * Состав выбран по тому, что компания действительно продаёт: у каждой услуги
 * отсюда есть кейсы в портфолио или статья в блоге. Порядок — по колонкам:
 * сначала сайты, затем продукты и платформы, затем автоматизация и поддержка.
 * Менять состав можно свободно, кроме этой витрины он ничего не задевает;
 * иконки для всех тридцати двух услуг остаются в `header-services-menu.tsx`,
 * поэтому вернуть любую строку — это одна правка здесь.
 */
export const HEADER_SERVICE_KEYS = [
  "corporate",
  "websiteTurnkey",
  "websites",
  "ecommerce",
  "b2b",
  "platforms",
  "telegram",
  "mobile",
  "ai",
  "integrations",
  "webDesign",
  "support",
] as const;

// Contextual internal links between service pages — feeds the "смежные услуги"
// block and strengthens the internal link graph for SEO.
export const RELATED_SERVICES: Record<string, string[]> = {
  corporate: ["webDesign", "websiteTurnkey", "websites", "branding"],
  websites: ["webDesign", "corporate", "businessCard", "websiteTurnkey"],
  websiteTurnkey: ["corporate", "ecommerce", "businessCard", "websites"],
  ecommerce: ["corporate", "b2b", "websiteTurnkey", "platforms"],
  businessCard: ["branding", "websites", "corporate", "webDesign"],
  b2b: ["corporate", "ecommerce", "platforms", "integrations"],
  telegram: ["mobile", "messenger", "ai", "integrations"],
  mobile: ["telegram", "messenger", "platforms", "ai"],
  ai: ["integrations", "telegram", "platforms", "mobile"],
  integrations: ["ai", "platforms", "techContent", "telegram"],
  blockchain: ["platforms", "mobile", "ai", "integrations"],
  support: ["itOutsourcing", "security", "platforms", "corporate"],
  contentAnalysis: ["commercialAudit", "techContent", "corporate", "websites"],
  techContent: ["contentAnalysis", "commercialAudit", "corporate", "integrations"],
  commercialAudit: ["contentAnalysis", "security", "techContent", "corporate"],
  platforms: ["b2b", "integrations", "ai", "support"],
  webDesign: ["branding", "corporate", "websites", "websiteTurnkey"],
  branding: ["webDesign", "businessCard", "corporate", "websites"],
  security: ["infosecAudit", "support", "commercialAudit", "platforms"],
  messenger: ["collaboration", "platforms", "mobile", "telegram"],

  infrastructure: ["itOutsourcing", "migration", "os", "infosecAudit"],
  migration: ["infrastructure", "os", "itOutsourcing", "infosecAudit"],
  os: ["infrastructure", "itOutsourcing", "migration", "collaboration"],
  itOutsourcing: ["infrastructure", "infosecMonitoring", "migration", "support"],
  infosecAudit: ["infosecTools", "security", "infosecConsulting", "infosecMonitoring"],
  infosecTools: [
    "infosecAudit",
    "infosecMonitoring",
    "infosecConsulting",
    "itOutsourcing",
  ],
  infosecConsulting: ["infosecAudit", "infosecTools", "security", "businessSystems"],
  infosecMonitoring: ["infosecTools", "infosecAudit", "itOutsourcing", "infrastructure"],
  collaboration: ["messenger", "integrations", "businessSystems", "itOutsourcing"],
  businessSystems: [
    "businessSystemsCustom",
    "integrations",
    "platforms",
    "collaboration",
  ],
  businessSystemsCustom: ["businessSystems", "integrations", "platforms", "support"],
  industrial: ["integrations", "businessSystems", "infrastructure", "platforms"],
};
