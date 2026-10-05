/**
 * Курс доллара с сайта ЦБ РФ → content/rate.json.
 *
 * Запускается перед каждой сборкой. Доллары на английской и испанской
 * версиях считаются из рублёвых цен по этому курсу и запекаются в HTML:
 * у статического сайта нет рантайма, а цена нужна в разметке — её читают
 * поисковики и забирает микроразметка AggregateOffer. Пересчёт в браузере
 * дал бы цену, которой нет в HTML, то есть невидимую для выдачи.
 *
 * Если ЦБ недоступен, скрипт НЕ роняет сборку: остаётся последний
 * сохранённый курс из content/rate.json. Файл поэтому лежит в репозитории —
 * деплой не должен зависеть от того, отвечает ли чужой сервис в эту минуту.
 *
 * Источник — официальный XML ЦБ (windows-1251, десятичная запятая). Парсится
 * регуляркой по латинской части разметки: тянуть ради одного числа парсер
 * XML и перекодировщик смысла нет.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "content", "rate.json");
const SOURCE = "https://www.cbr.ru/scripts/XML_daily.asp";

async function readSaved() {
  try {
    return JSON.parse(await readFile(TARGET, "utf8"));
  } catch {
    return null;
  }
}

async function fetchRate() {
  const response = await fetch(SOURCE, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`ЦБ ответил ${response.status}`);

  // Байты декодируются как latin1: кириллица в названиях валют превратится в
  // мусор, но нам нужны только CharCode и число, а они латиницей и цифрами.
  const xml = Buffer.from(await response.arrayBuffer()).toString("latin1");

  const usd = /<CharCode>USD<\/CharCode>.*?<Value>([\d,]+)<\/Value>/s.exec(xml);
  if (!usd) throw new Error("в ответе ЦБ нет USD");

  const date = /ValCurs Date="([\d.]+)"/.exec(xml)?.[1];
  const value = Number(usd[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`странный курс: ${usd[1]}`);

  return { usd: value, date: date ?? null, fetchedAt: new Date().toISOString() };
}

const saved = await readSaved();

try {
  const rate = await fetchRate();
  await writeFile(TARGET, `${JSON.stringify(rate, null, 2)}\n`, "utf8");
  console.log(`курс ЦБ: ${rate.usd} ₽/$ на ${rate.date}`);
} catch (error) {
  if (!saved) {
    // Первый запуск без сети — чинить нечем, и молча собрать сайт без цен
    // хуже, чем упасть с понятным текстом.
    console.error(`не удалось получить курс и нет сохранённого: ${error.message}`);
    process.exit(1);
  }
  console.warn(
    `курс ЦБ недоступен (${error.message}), берём сохранённый: ${saved.usd} ₽/$ на ${saved.date}`,
  );
}
