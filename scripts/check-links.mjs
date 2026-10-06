/**
 * Проверка всех внутренних ссылок в собранном экспорте.
 *
 * Берёт каждую страницу из out/, вытаскивает все href, ведущие внутрь сайта,
 * и проверяет, что по каждому адресу действительно лежит файл. Плюс отдельно
 * сверяет переключатель языков: с любой страницы ссылки на три языка должны
 * вести на существующие страницы, а не в 404.
 *
 * Нужно потому, что ни сборка, ни типы таких ссылок не ловят: `href="/"` —
 * совершенно валидный код, который на английской странице уводит на русскую
 * главную. А `/en/services/crm-development/` при наивном снятии префикса
 * превращается в `/services/crm-development/`, которого не существует. Оба
 * раза это нашлось только просмотром готовых страниц — значит проверке и
 * место здесь, а не в сборке.
 *
 * Запуск: node scripts/check-links.mjs (после npm run build)
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

if (!existsSync(OUT)) {
  console.error("нет папки out/ — сначала npm run build");
  process.exit(1);
}

/** Все index.html в экспорте → их адреса. */
async function pages(dir = OUT, prefix = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await pages(full, `${prefix}/${entry.name}`)));
    } else if (entry.name === "index.html") {
      found.push({ url: `${prefix}/` || "/", file: full });
    }
  }
  return found;
}

const all = await pages();
const known = new Set(all.map((p) => p.url));

/** Файл по адресу: страница, либо статика вроде /LOGO.svg. */
function exists(href) {
  if (known.has(href)) return true;
  const asFile = join(OUT, href.replace(/^\//, ""));
  return existsSync(asFile);
}

const INTERNAL = /href="(\/[^"#?]*)(?:[#?][^"]*)?"/g;
/** Панель — внутренний инструмент, её не переводим и в проверку не берём. */
const SKIP = (href) => href.startsWith("/panel") || href.startsWith("/_next");

const broken = new Map();
let checked = 0;

for (const page of all) {
  const html = await readFile(page.file, "utf8");
  // Данные страницы лежат в <script> и ссылками не являются: там сериализован
  // контент, в том числе чужие адреса из текста статей.
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");

  for (const [, href] of visible.matchAll(INTERNAL)) {
    if (SKIP(href)) continue;
    checked += 1;
    if (!exists(href)) {
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(page.url);
    }
  }
}

console.log(`страниц: ${all.length}, внутренних ссылок проверено: ${checked}`);

if (broken.size) {
  console.error(`\nБИТЫХ АДРЕСОВ: ${broken.size}`);
  for (const [href, from] of broken) {
    const list = [...from];
    console.error(`  ${href}`);
    console.error(
      `      встречается на: ${list.slice(0, 3).join(", ")}${list.length > 3 ? ` и ещё ${list.length - 3}` : ""}`,
    );
  }
  process.exit(1);
}

console.log("все внутренние ссылки ведут на существующие страницы");

// ------------------------------------- Ссылка не должна уводить с языка

/**
 * Каждая ссылка со страницы под /en/ обязана вести внутрь /en/ — и так же
 * для /es/. Проверка существования адреса этого не ловит: `/` и `/#process`
 * существуют, просто ведут на русскую главную. Ровно так и прятались две
 * ошибки подряд — логотип с хлебными крошками и якоря разделов в шапке.
 *
 * Из правила выпадают только файлы: картинки, шрифты и прочая статика одна
 * на все языки, и префикса у неё нет и быть не должно.
 */
const FILE = /\.[a-z0-9]{2,5}$/i;
const leaks = new Map();
let localeChecked = 0;

for (const page of all) {
  const { locale } = ((u) => {
    const first = u.split("/").filter(Boolean)[0];
    return { locale: first === "en" || first === "es" ? first : "ru" };
  })(page.url);
  if (locale === "ru") continue;
  if (page.url.startsWith("/panel")) continue;

  const html = await readFile(page.file, "utf8");
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");

  for (const [, href] of visible.matchAll(/href="(\/[^"]*)"/g)) {
    if (SKIP(href)) continue;
    const bare = href.split(/[#?]/)[0];
    if (FILE.test(bare)) continue;
    localeChecked += 1;
    if (!href.startsWith(`/${locale}/`)) {
      const key = `${locale}: ${href}`;
      if (!leaks.has(key)) leaks.set(key, new Set());
      leaks.get(key).add(page.url);
    }
  }
}

console.log(`
ссылок на языковых страницах проверено: ${localeChecked}`);
if (leaks.size) {
  console.error(`УВОДЯТ С ЯЗЫКА: ${leaks.size}`);
  for (const [key, from] of [...leaks].slice(0, 15)) {
    const list = [...from];
    console.error(`  ${key}`);
    console.error(`      со страниц: ${list.slice(0, 2).join(", ")}${list.length > 2 ? ` и ещё ${list.length - 2}` : ""}`);
  }
  process.exit(1);
}
console.log("ни одна ссылка не уводит с языковой версии на другой язык");

// --------------------------------------- Метки цен должны быть раскрыты

/**
 * `{price:120000}` — метка суммы в рублях, из которой на английской и
 * испанской версиях считаются доллары. Если её забыли раскрыть на каком-то
 * месте вывода, посетитель увидит фигурные скобки прямо на странице.
 *
 * Смотрим только видимую разметку: в сериализованных данных страницы каталог
 * строк лежит сырым, и метки там — норма, их раскрывает хук при отрисовке.
 */
let withTokens = 0;
for (const page of all) {
  const html = await readFile(page.file, "utf8");
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
  const hits = visible.match(/\{price:\d+(?:\/mo)?\}/g);
  if (hits) {
    console.error(`  метка цены на виду: ${page.url} — ${hits.slice(0, 3).join(", ")}`);
    withTokens += 1;
  }
}
if (withTokens) {
  console.error(`
СТРАНИЦ С НЕРАСКРЫТЫМИ ЦЕНАМИ: ${withTokens}`);
  process.exit(1);
}
console.log("метки цен раскрыты везде, где они видны посетителю");

// ---------------------------------------------- Переключатель языков

/**
 * Переключатель живёт в бургер-меню и в статику не попадает — проверить его
 * просмотром HTML нельзя. Зато можно повторить его логику на тех же данных и
 * убедиться, что с каждой страницы ссылки на три языка ведут на существующие.
 *
 * Именно здесь пряталась ошибка: наивное снятие префикса превращало
 * `/en/services/crm-development/` в `/services/crm-development/`, и
 * переключатель работал только на главной.
 */
const catalog = JSON.parse(await readFile(join(ROOT, "content/service-catalog.json"), "utf8"));
const slugs = JSON.parse(await readFile(join(ROOT, "content/slugs.json"), "utf8"));
const blog = JSON.parse(await readFile(join(ROOT, "content/blog.json"), "utf8"));

const SEG = {
  services: { ru: "uslugi", en: "services", es: "servicios" },
  projects: { ru: "proekty", en: "projects", es: "proyectos" },
  blog: { ru: "blog", en: "blog", es: "blog" },
  privacy: { ru: "politika-konfidencialnosti", en: "privacy-policy", es: "politica-de-privacidad" },
};
const LOC = ["ru", "en", "es"];
const prefix = (l) => (l === "ru" ? "" : `/${l}`);
const ruServiceSlug = Object.fromEntries(catalog.services.map((s) => [s.key, s.slug]));
const serviceSlug = (k, l) => (l === "ru" ? ruServiceSlug[k] : slugs.services[k]?.[l] ?? ruServiceSlug[k]);
const postSlug = (ru, l) => (l === "ru" ? ru : slugs.posts[ru]?.[l] ?? ru);

/** Адрес → описание страницы, независимое от языка. */
function resolve(url) {
  const parts = url.split("/").filter(Boolean);
  let locale = "ru";
  if (parts[0] === "en" || parts[0] === "es") locale = parts.shift();
  if (parts.length === 0) return { kind: "home" };
  // 403 — один сегмент на все языки, как в FORBIDDEN_SEGMENT из i18n/routes.
  if (parts.length === 1 && parts[0] === "403") return { kind: "forbidden" };
  const section = Object.keys(SEG).find((s) => SEG[s][locale] === parts[0]);
  if (!section) return { kind: "unknown" };
  if (parts.length === 1) return { kind: "section", section };
  if (section === "services") {
    const key = Object.keys(ruServiceSlug).find((k) => serviceSlug(k, locale) === parts[1]);
    return key ? { kind: "service", key } : { kind: "unknown" };
  }
  if (section === "blog") {
    const ru = blog.find((p) => postSlug(p.slug, locale) === parts[1])?.slug;
    return ru ? { kind: "post", ru } : { kind: "unknown" };
  }
  return { kind: "unknown" };
}

function build(page, l) {
  if (page.kind === "home") return `${prefix(l)}/`;
  if (page.kind === "section") return `${prefix(l)}/${SEG[page.section][l]}/`;
  if (page.kind === "service") return `${prefix(l)}/${SEG.services[l]}/${serviceSlug(page.key, l)}/`;
  if (page.kind === "post") return `${prefix(l)}/${SEG.blog[l]}/${postSlug(page.ru, l)}/`;
  if (page.kind === "forbidden") return `${prefix(l)}/403/`;
  return `${prefix(l)}/`;
}

/**
 * Что переключателю знать не положено:
 *
 * - /panel/ — внутренний инструмент, он русский по решению (см. CLAUDE.md);
 * - /404/ — служебная страница Next, не адрес сайта;
 * - «надгробия» переехавших страниц. Это статические файлы в public/ с
 *   meta refresh и canonical на новый адрес: редирект сервером сделать нечем,
 *   nginx не читает .htaccess. Такая страница существует ради поисковика, а
 *   человека с неё немедленно уводит — переводить её незачем.
 */
const tombstones = new Set();
for (const page of all) {
  const html = await readFile(page.file, "utf8");
  if (/http-equiv="refresh"/i.test(html)) tombstones.add(page.url);
}

let switchChecked = 0;
const switchBroken = [];
for (const page of all) {
  if (page.url.startsWith("/panel")) continue;
  if (page.url === "/404/") continue;
  if (tombstones.has(page.url)) continue;
  const resolved = resolve(page.url);
  if (resolved.kind === "unknown") {
    switchBroken.push(`${page.url} — адрес не разобран, переключатель увёл бы на главную`);
    continue;
  }
  for (const l of LOC) {
    switchChecked += 1;
    const target = build(resolved, l);
    if (!known.has(target)) switchBroken.push(`${page.url} → ${l} → ${target} (нет такой страницы)`);
  }
}

console.log(`\nпереключатель языков: проверено переходов ${switchChecked}`);
if (switchBroken.length) {
  console.error(`СЛОМАННЫХ ПЕРЕХОДОВ: ${switchBroken.length}`);
  switchBroken.slice(0, 15).forEach((b) => console.error(`  ${b}`));
  process.exit(1);
}
console.log("с любой страницы все три языка ведут на существующие страницы");
