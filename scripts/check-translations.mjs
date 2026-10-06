/**
 * Проверка переводов услуг, кейсов и политики конфиденциальности.
 *
 * Запускается руками после каждой партии перевода. Ловит то, что сборка
 * пропускает молча: расхождение длин списков (в русском шесть пунктов, в
 * английском пять — и один просто исчезнет со страницы), забытую кириллицу,
 * опечатку в метке цены и перевод услуги, которой нет в каталоге.
 *
 * Сборка такие вещи не ловит принципиально: с точки зрения TypeScript это
 * валидный JSON, а страница собирается и выглядит целой — просто в ней чего-то
 * нет. Поэтому проверка отдельная.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (p) => JSON.parse(await readFile(join(ROOT, p), "utf8"));

const services = await read("content/services.json");
const cases = await read("content/cases.json");
const privacy = await read("content/privacy.json");
const posts = await read("content/blog.json");
const rate = await read("content/rate.json");
const catalog = await read("content/service-catalog.json");
const catalogKeys = new Set(catalog.services.map((s) => s.key));
const categoryTitles = await read("content/translations/service-categories.json");

const problems = [];
const note = (locale, where, text) => problems.push(`${locale} · ${where}: ${text}`);

const CYRILLIC = /[Ѐ-ӿ]/;
const PRICE_TOKEN = /\{price:(\d+)(\/mo)?\}/g;
/**
 * Суммы, встречающиеся в русском тексте услуг, — чтобы метка не называла
 * цену, которой нигде нет.
 *
 * Берутся не только из тарифов: в описаниях и ответах FAQ попадаются суммы,
 * которых в тарифной таблице нет. У Telegram-ботов, например, в ответе
 * упомянута Mini App «от 100 000 ₽», а тарифы идут 50 000 / 110 000 / 220 000.
 * Такая метка законна, и проверка не должна на неё ругаться.
 */
const KNOWN_AMOUNTS = new Set();
for (const [, amount] of JSON.stringify(services).matchAll(
  /(\d[\d\s \u00a0]*)\s*₽/g,
)) {
  const digits = amount.replace(/[^\d]/g, "");
  if (digits) KNOWN_AMOUNTS.add(digits);
}

for (const locale of ["en", "es"]) {
  // ---------------------------------------------------------------- услуги
  const t = await read(`content/translations/services.${locale}.json`);

  for (const [key, tr] of Object.entries(t)) {
    if (!catalogKeys.has(key)) note(locale, key, "услуги нет в каталоге");
    const ru = services.find((p) => p.key === key);
    if (!ru) {
      note(locale, key, "нет в content/services.json");
      continue;
    }

    const lists = [
      ["includes", ru.includes, tr.includes],
      ["forWhom", ru.forWhom, tr.forWhom],
      ["steps", ru.steps, tr.steps],
      ["faq", ru.faq, tr.faq],
      ["tariffs", ru.tariffs, tr.tariffs],
    ];
    for (const [name, source, translated] of lists) {
      if (!translated) continue;
      if (!source) {
        note(locale, `${key}.${name}`, "переведено, но в русском такого списка нет");
        continue;
      }
      if (source.length !== translated.length) {
        note(
          locale,
          `${key}.${name}`,
          `${translated.length} пунктов вместо ${source.length}`,
        );
      }
    }

    for (const tariff of tr.tariffs ?? []) {
      if ("price" in tariff) {
        note(locale, `${key}.tariffs`, "цена в переводе — она считается из рублёвой");
      }
      const ruTariff = ru.tariffs?.[tr.tariffs.indexOf(tariff)];
      if (ruTariff && tariff.features?.length !== ruTariff.features.length) {
        note(
          locale,
          `${key}.tariffs.${tariff.name}`,
          `${tariff.features?.length} пунктов вместо ${ruTariff.features.length}`,
        );
      }
    }

    const flat = JSON.stringify(tr);
    if (CYRILLIC.test(flat)) note(locale, key, "осталась кириллица");
    for (const [, amount] of flat.matchAll(PRICE_TOKEN)) {
      if (!KNOWN_AMOUNTS.has(amount)) {
        note(locale, key, `метка {price:${amount}} — такой цены нет ни в одном тарифе`);
      }
    }
    if (/\d[\d\s ]*\s*₽/.test(flat)) {
      note(locale, key, "рублёвая сумма прописью вместо метки {price:…}");
    }
  }

  const done = Object.keys(t).length;
  console.log(
    `${locale}: услуг ${done}/${services.length}` +
      (done < services.length
        ? ` — осталось ${services.filter((p) => !t[p.key]).map((p) => p.key).join(", ")}`
        : ""),
  );

  // ---------------------------------------------------------------- кейсы
  const tc = await read(`content/translations/cases.${locale}.json`);
  for (const [slug, tr] of Object.entries(tc)) {
    const ru = cases.find((c) => c.slug === slug);
    if (!ru) {
      note(locale, `кейс ${slug}`, "нет в content/cases.json");
      continue;
    }
    if (tr.tags?.length !== ru.tags.length) {
      note(locale, `кейс ${slug}`, `тегов ${tr.tags?.length} вместо ${ru.tags.length}`);
    }
    if (CYRILLIC.test(JSON.stringify(tr))) note(locale, `кейс ${slug}`, "кириллица");
  }
  console.log(`${locale}: кейсов ${Object.keys(tc).length}/${cases.length}`);

  // ------------------------------------------------------------------ блог
  // Статья сверяется по разделам, абзацам и выводам: перевод накладывается
  // целиком, и пропавший абзац — это молча пропавший кусок статьи. Правка
  // статьи в панели тоже ловится здесь: разошлось число абзацев — перевод
  // устарел.
  const tb = await read(`content/translations/blog.${locale}.json`);
  for (const [slug, tr] of Object.entries(tb)) {
    const ru = posts.find((p) => p.slug === slug);
    if (!ru) {
      note(locale, `статья ${slug}`, "нет в content/blog.json");
      continue;
    }
    if (tr.sections.length !== ru.sections.length) {
      note(locale, `статья ${slug}`, `разделов ${tr.sections.length} вместо ${ru.sections.length}`);
    }
    ru.sections.forEach((section, i) => {
      const got = tr.sections[i]?.body.length;
      if (got !== undefined && got !== section.body.length) {
        note(locale, `статья ${slug}, раздел ${i + 1}`, `абзацев ${got} вместо ${section.body.length}`);
      }
    });
    if (tr.takeaways.length !== ru.takeaways.length) {
      note(locale, `статья ${slug}`, `выводов ${tr.takeaways.length} вместо ${ru.takeaways.length}`);
    }
    if (tr.cover && !existsSync(join(ROOT, "public", tr.cover))) {
      note(locale, `статья ${slug}`, `обложки ${tr.cover} нет в public/`);
    }
    const flat = JSON.stringify(tr);
    if (CYRILLIC.test(flat)) note(locale, `статья ${slug}`, "осталась кириллица");
    if (/₽/.test(flat)) note(locale, `статья ${slug}`, "рублёвая сумма вместо метки {price:…}");
    // Мелкая сумма после пересчёта и округления превращается в «$0».
    for (const [token, amount] of flat.matchAll(/\{price:(\d+)(?:\/mo)?\}/g)) {
      if (Number(amount) / rate.usd < 25) {
        note(locale, `статья ${slug}`, `${token} на сайте выйдет как $0 — напишите словами`);
      }
    }
  }
  console.log(`${locale}: статей ${Object.keys(tb).length}/${posts.length}`);

  // ------------------------------------------------------- разделы каталога
  // Раздел заводится в панели, и перевода у него поначалу нет — на /en/ его
  // кнопка-фильтр выйдет по-русски. Ровно так и вышло с первыми восемью.
  for (const category of catalog.categories) {
    const title = categoryTitles[category.key]?.[locale];
    if (!title) note(locale, `раздел ${category.key}`, `нет перевода для «${category.title}»`);
    else if (CYRILLIC.test(title)) note(locale, `раздел ${category.key}`, "кириллица");
  }

  // -------------------------------------------------------------- политика
  // Документ юридический, поэтому сверяется по блокам: пропавший пункт в
  // списке прав субъекта — это уже другая политика, а не неточный перевод.
  const tp = await read(`content/translations/privacy.${locale}.json`);
  if (!tp.notice) note(locale, "политика", "нет оговорки о том, что это перевод");
  if (tp.sections.length !== privacy.sections.length) {
    note(locale, "политика", `разделов ${tp.sections.length} вместо ${privacy.sections.length}`);
  }
  privacy.sections.forEach((ruSection, i) => {
    const section = tp.sections[i];
    if (!section) return;
    if (section.blocks.length !== ruSection.blocks.length) {
      note(locale, `политика, раздел ${i + 1}`, `блоков ${section.blocks.length} вместо ${ruSection.blocks.length}`);
      return;
    }
    ruSection.blocks.forEach((ruBlock, j) => {
      const block = section.blocks[j];
      if (block.type !== ruBlock.type) {
        note(locale, `политика, раздел ${i + 1}`, `блок ${j + 1}: ${block.type} вместо ${ruBlock.type}`);
      } else if (block.type === "list" && block.items.length !== ruBlock.items.length) {
        note(locale, `политика, раздел ${i + 1}`, `пунктов ${block.items.length} вместо ${ruBlock.items.length}`);
      }
    });
  });
  // Юридическое наименование остаётся русским: это реквизит, а не текст.
  if (CYRILLIC.test(JSON.stringify(tp).replaceAll("ООО «ИТ ОПТИМИЗАЦИЯ»", ""))) {
    note(locale, "политика", "осталась кириллица");
  }
  console.log(`${locale}: политика ${tp.sections.length}/${privacy.sections.length} разделов`);
}

console.log();
if (problems.length) {
  console.error(`проблем: ${problems.length}`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("переводы согласованы с русскими данными");
