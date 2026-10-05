import rate from "../../content/rate.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/**
 * Цены на трёх языках.
 *
 * Источник правды один — рублёвая цена в `content/services.json`, которую
 * правит владелец. Доллары выводятся из неё по курсу ЦБ на момент сборки
 * (`scripts/fetch-rate.mjs`), а не хранятся вторым списком: два списка цен
 * рано или поздно разойдутся, и клиенту покажут не то, что обещал прайс.
 *
 * Округление обязательно. `$1 412` читается как результат деления и выдаёт,
 * что настоящая цена другая; `$1 400` читается как цена. Шаг округления
 * растёт вместе с суммой — на мелких заказах точность важнее, на крупных
 * круглое число выглядит честнее дробного.
 */

const RUB_PER_USD = rate.usd;

/** Дата курса — для оговорки под тарифами. */
export const RATE_DATE = rate.date;
export const RATE_VALUE = rate.usd;

function roundUsd(value: number): number {
  if (value < 1000) return Math.round(value / 50) * 50;
  if (value < 5000) return Math.round(value / 100) * 100;
  return Math.round(value / 500) * 500;
}

/** Разделитель разрядов — неразрывный пробел, чтобы цена не переносилась. */
function groups(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Рублёвая сумма → строка в валюте локали.
 * Русский остаётся в рублях, остальные языки — в долларах.
 */
export function formatPrice(rub: number, locale: Locale, monthly = false): string {
  if (locale === DEFAULT_LOCALE) {
    return `${groups(rub)} ₽${monthly ? "/мес" : ""}`;
  }
  const usd = roundUsd(rub / RUB_PER_USD);
  return `$${groups(usd)}${monthly ? "/mo" : ""}`;
}

/**
 * Разбирает русскую строку цены («от 120 000 ₽», «от 40 000 ₽/мес») на число
 * и признак помесячности. Нужно, чтобы не дублировать цены в переводах:
 * тариф хранится один раз, по-русски, а язык решает только форму показа.
 */
export function parseRubPrice(
  value: string,
): { amount: number; monthly: boolean } | null {
  const match = /([\d\s ]+)\s*₽(\s*\/\s*мес)?/u.exec(value);
  if (!match) return null;
  const amount = Number(match[1].replace(/[\s ]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, monthly: Boolean(match[2]) };
}

/** Слово «от» / «from» / «desde» перед ценой. */
const FROM: Record<Locale, string> = { ru: "от", en: "from", es: "desde" };

/** «от 120 000 ₽» → «from $1 400». Не распознали — отдаём как было. */
export function localizePrice(value: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return value;
  const parsed = parseRubPrice(value);
  if (!parsed) return value;
  const prefix = /^\s*от\b/u.test(value) ? `${FROM[locale]} ` : "";
  return `${prefix}${formatPrice(parsed.amount, locale, parsed.monthly)}`;
}

/**
 * Подстановка цен внутрь переведённого текста.
 *
 * В описаниях и ответах FAQ цена стоит посреди фразы, и вынести её оттуда
 * нельзя. Поэтому в английском и испанском текстах пишется метка
 * `{price:120000}` или `{price:40000/mo}`, а сюда она приходит числом в
 * рублях и превращается в доллары по тому же курсу. Русский текст меток не
 * содержит: там цена написана словами и живёт в content/.
 */
export function applyPrices(text: string, locale: Locale): string {
  return text.replace(/\{price:(\d+)(\/mo)?\}/g, (_, amount: string, mo?: string) =>
    formatPrice(Number(amount), locale, Boolean(mo)),
  );
}

/**
 * Код валюты для микроразметки.
 *
 * Обязан совпадать с тем, что реально написано в цене на странице: разметка
 * с числом в долларах и кодом RUB сообщает поисковику цену в сто раз меньше
 * настоящей, и он покажет её в выдаче.
 */
export const CURRENCY: Record<Locale, string> = {
  ru: "RUB",
  en: "USD",
  es: "USD",
};
