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

export function formatMoney(amount: number, currency: Currency): string {
  return `${amount.toLocaleString("ru-RU")} ${SIGN[currency]}`;
}

/** Итог по каждой валюте. Пустые не попадают: «0 $» рядом с рублями — шум. */
export function sumByCurrency(
  rows: { amount: number | null; currency: Currency }[],
): Partial<Record<Currency, number>> {
  const totals: Partial<Record<Currency, number>> = {};
  for (const row of rows) {
    if (!row.amount) continue;
    totals[row.currency] = (totals[row.currency] ?? 0) + row.amount;
  }
  return totals;
}
