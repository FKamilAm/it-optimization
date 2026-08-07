export const SITE = {
  name: "Айти-Оптимизация",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@itoptimizations.ru",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+79937266061",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/dujaii",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/79963266161",
  // NOTE: MAX has no phone-based chat links — set this to a MAX profile/bot link.
  max: process.env.NEXT_PUBLIC_MAX_URL ?? "https://max.ru/",
} as const;

export const ORG = {
  legalName: "ООО «ИТ ОПТИМИЗАЦИЯ»",
  inn: "8600002653",
  kpp: "860001001",
  ogrn: "1268600004463",
  address:
    "628162, Ханты-Мансийский - Югра автономный округ, Белоярский р-н, г. Белоярский, ул. Молодости, д. 1, кв. 68",
  phone: "+7 996 326-61-61",
} as const;

// Direct contact channels — the site links straight into a messenger / call /
// email instead of collecting personal data through a form.
//   action "link" — open the target directly (works well for Telegram / WhatsApp)
//   action "copy" — show a small popover with the value + "copy" button
//                   (better for phone, e-mail and MAX, which has no chat link)
export const CONTACT_CHANNELS = [
  {
    key: "telegram",
    label: "Telegram",
    value: "@dujaii",
    href: SITE.telegram,
    external: true,
    action: "link",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    value: "+7 996 326-61-61",
    href: SITE.whatsapp,
    external: true,
    action: "link",
  },
  {
    key: "max",
    label: "MAX",
    value: "+7 996 326-61-61",
    href: SITE.max,
    external: false,
    action: "copy",
  },
  {
    key: "phone",
    label: "Телефон",
    value: "+7 993 726-60-61",
    href: `tel:${SITE.phone}`,
    external: false,
    action: "copy",
  },
  {
    key: "email",
    label: "Email",
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

// Service key → dedicated SEO page slug (under /uslugi/…). Every service has its
// own page, so cards link straight to these pages.
export const SERVICE_PAGES: Record<string, string> = {
  corporate: "razrabotka-korporativnogo-sajta",
  websites: "razrabotka-sajtov",
  websiteTurnkey: "veb-sajt-pod-klyuch",
  ecommerce: "internet-magazin-pod-klyuch",
  businessCard: "razrabotka-sajta-vizitki",
  webDesign: "veb-dizajn-sistemy",
  branding: "dizajn-i-brending",
  b2b: "razrabotka-sajta-dlya-b2b",
  telegram: "razrabotka-telegram-botov",
  mobile: "razrabotka-mobilnyh-prilozhenij",
  ai: "vnedrenie-ai",
  integrations: "parsing-i-integracii",
  blockchain: "blockchain-razrabotka",
  support: "it-soprovozhdenie",
  contentAnalysis: "analiz-kontenta-sajta",
  techContent: "tehnicheskij-kontent-sajta",
  commercialAudit: "kommercheskij-audit-sajta",
  platforms: "razrabotka-crm",
  // Слуг единственного числа — у статьи блога про ту же тему множественное
  // (audit-bezopasnosti-sajtov). Пара близкая, поэтому интенты разведены в
  // заголовках: статья отвечает «что это и как проходит», страница — «заказать,
  // цена, сроки». Иначе они конкурировали бы за один и тот же запрос.
  security: "audit-bezopasnosti-sajta",
  // Не razrabotka-messendzherov: этот запрос мёртвый — статья с таким
  // заголовком за три месяца не собрала ни одного показа. Услуга про
  // внутренние мессенджеры для сотрудников, и живой запрос здесь именно
  // «корпоративный мессенджер».
  messenger: "korporativnyj-messendzher",
};

export const NAV_ITEMS = [
  { key: "home", href: "#home" },
  { key: "process", href: "#process" },
  { key: "services", href: "#services" },
  { key: "industries", href: "#industries" },
  { key: "solutions", href: "#solutions" },
  { key: "faq", href: "#faq" },
  { key: "contact", href: "#contact" },
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

// Ordered service list — the canonical order for the homepage grid and the
// header "Услуги" dropdown. Each entry pairs a services.items.<key> catalog
// label with its dedicated /uslugi/<slug> page.
export const SERVICE_NAV = [
  { key: "corporate", slug: SERVICE_PAGES.corporate },
  { key: "websites", slug: SERVICE_PAGES.websites },
  { key: "websiteTurnkey", slug: SERVICE_PAGES.websiteTurnkey },
  { key: "ecommerce", slug: SERVICE_PAGES.ecommerce },
  { key: "businessCard", slug: SERVICE_PAGES.businessCard },
  { key: "webDesign", slug: SERVICE_PAGES.webDesign },
  { key: "branding", slug: SERVICE_PAGES.branding },
  { key: "b2b", slug: SERVICE_PAGES.b2b },
  { key: "telegram", slug: SERVICE_PAGES.telegram },
  { key: "mobile", slug: SERVICE_PAGES.mobile },
  { key: "messenger", slug: SERVICE_PAGES.messenger },
  { key: "ai", slug: SERVICE_PAGES.ai },
  { key: "integrations", slug: SERVICE_PAGES.integrations },
  { key: "blockchain", slug: SERVICE_PAGES.blockchain },
  { key: "support", slug: SERVICE_PAGES.support },
  { key: "security", slug: SERVICE_PAGES.security },
  { key: "contentAnalysis", slug: SERVICE_PAGES.contentAnalysis },
  { key: "techContent", slug: SERVICE_PAGES.techContent },
  { key: "commercialAudit", slug: SERVICE_PAGES.commercialAudit },
  { key: "platforms", slug: SERVICE_PAGES.platforms },
] as const;

// Что показывает главная в блоке «Популярные направления» — витрина, а не
// каталог: полный список из 18 услуг живёт на /uslugi/, куда ведёт кнопка над
// сеткой. Четыре ключа заполняют ровно один ряд на широком экране (xl:grid-cols-4).
// Порядок здесь и есть порядок карточек; менять состав можно свободно, ничего
// кроме этой витрины он не задевает.
export const HOME_SERVICE_KEYS = ["corporate", "platforms", "telegram", "ai"] as const;

// Blog posts, newest first. `key` maps to the blog.posts.<key> catalog block;
// `slug` is the /blog/<slug> page URL; `cover` is the committed hero artwork.
//
// `publishedAt` / `updatedAt` — ISO-даты (день, без времени). Нужны в двух
// местах: Article-разметка без datePublished неполная для Google, а sitemap без
// реального lastmod вынужден подставлять время сборки, то есть врать. Правки
// текста статьи — повод обновить updatedAt вручную; это редкое событие, и
// выводить дату из истории git на сборке нельзя — на CI её нет (checkout
// делается с depth 1).
export const BLOG_POSTS = [
  {
    key: "securityAudit",
    slug: "audit-bezopasnosti-sajtov",
    cover: "/blog/audit-bezopasnosti-sajtov.svg",
    publishedAt: "2026-07-18",
    updatedAt: "2026-07-18",
  },
  {
    key: "messengers",
    slug: "razrabotka-messendzherov",
    cover: "/blog/razrabotka-messendzherov.svg",
    publishedAt: "2026-07-18",
    updatedAt: "2026-07-18",
  },
  {
    key: "parsing",
    slug: "parsing-dannyh",
    cover: "/blog/parsing-dannyh.svg",
    publishedAt: "2026-07-18",
    updatedAt: "2026-08-05",
  },
] as const;

export type BlogPost = (typeof BLOG_POSTS)[number];

export function blogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function blogPostByKey(key: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.key === key);
}

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
  support: ["security", "platforms", "corporate", "integrations"],
  contentAnalysis: ["commercialAudit", "techContent", "corporate", "websites"],
  techContent: ["contentAnalysis", "commercialAudit", "corporate", "integrations"],
  commercialAudit: ["contentAnalysis", "security", "techContent", "corporate"],
  platforms: ["b2b", "integrations", "ai", "support"],
  webDesign: ["branding", "corporate", "websites", "websiteTurnkey"],
  branding: ["webDesign", "businessCard", "corporate", "websites"],
  security: ["support", "commercialAudit", "corporate", "platforms"],
  messenger: ["platforms", "mobile", "telegram", "integrations"],
};

// Service page → relevant blog posts (topical cross-linking).
//
// Каждая из двух статей теперь имеет профильную услугу, поэтому связи сузились:
// раньше статья про безопасность вела на корпоративные сайты и B2B просто
// потому, что больше вести было некуда, а статья про мессенджеры — на
// Telegram-ботов, хотя это принципиально другой продукт (в FAQ услуги это
// прямо объясняется). Лишние пары убраны: обратная карта SERVICES_BY_ARTICLE
// строится отсюда, и каждая неточность здесь становится неточной ссылкой в
// конце статьи.
export const RELATED_ARTICLES: Record<string, string[]> = {
  integrations: ["parsing"],
  security: ["securityAudit"],
  support: ["securityAudit"],
  messenger: ["messengers"],
  mobile: ["messengers"],
};

/**
 * Обратная связь: статья → услуги, о которых она.
 *
 * Выводится из RELATED_ARTICLES, а не задаётся отдельной таблицей: связь между
 * статьёй и услугой одна и та же в обе стороны, и два списка рано или поздно
 * разошлись бы. Порядок услуг внутри статьи повторяет порядок SERVICE_NAV,
 * чтобы он не зависел от того, как перечислены ключи в RELATED_ARTICLES.
 *
 * Зачем вообще: статьи собирают 79% показов сайта, но до этого не вели ни на
 * одну коммерческую страницу — человек, пришедший по «парсингу базы данных»,
 * дочитывал и уходил, не узнав, что это можно заказать.
 */
export const SERVICES_BY_ARTICLE: Record<string, string[]> = (() => {
  const order = new Map<string, number>(
    SERVICE_NAV.map(({ key }, index) => [key, index]),
  );
  const byArticle: Record<string, string[]> = {};

  for (const [serviceKey, articleKeys] of Object.entries(RELATED_ARTICLES)) {
    for (const articleKey of articleKeys) {
      (byArticle[articleKey] ??= []).push(serviceKey);
    }
  }

  for (const services of Object.values(byArticle)) {
    services.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }

  return byArticle;
})();
