import type { Currency } from "@prisma/client";

/**
 * Суммы в разных валютах не складываются нигде.
 *
 * Перевести доллары в рубли можно только по какому-то курсу, а курса у CRM
 * нет и брать его неоткуда: любой подставленный сегодня превратит вчерашний
 * итог в неправду завтра. Поэтому итог — это не число, а несколько чисел,
 * по одному на валюту.
 */

const SIGN: Record<Currency, string> = { rub: "₽", usd: "$" };

/**
 * Принимает минорные единицы: 519 → «5,19 $». Дробная часть показывается
 * только когда она есть — «45 000 ₽» читается лучше, чем «45 000,00 ₽».
 */
export function formatMoney(minor: number, currency: Currency): string {
  // Либо копеек нет вовсе, либо их две: «0,3 ₽» для денег выглядит обрубком.
  const text = (minor / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${text} ${SIGN[currency]}`;
}

/** Итог по каждой валюте. Пустые не попадают: «0 $» рядом с рублями — шум. */
export function sumByCurrency(
  rows: { amountMinor: number | null; currency: Currency }[],
): Partial<Record<Currency, number>> {
  const totals: Partial<Record<Currency, number>> = {};
  for (const row of rows) {
    if (!row.amountMinor) continue;
    totals[row.currency] = (totals[row.currency] ?? 0) + row.amountMinor;
  }
  return totals;
}
