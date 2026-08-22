/**
 * Деньги в CRM.
 *
 * Валюта хранится рядом с каждой суммой, а не одна на всю систему: часть работ
 * считается в долларах. Отсюда правило, которое легко нарушить: **суммы в
 * разных валютах нигде не складываются**. Курса у CRM нет и взять его неоткуда,
 * а любой подставленный сегодня сделает вчерашний итог неправдой завтра.
 * Поэтому итог — не число, а несколько чисел, по одному на валюту.
 */

export type Currency = "rub" | "usd";

export const CURRENCIES: { value: Currency; label: string; sign: string }[] = [
  { value: "rub", label: "₽", sign: "₽" },
  { value: "usd", label: "$", sign: "$" },
];

const SIGN: Record<Currency, string> = { rub: "₽", usd: "$" };

/** «120 000 ₽», «1 500 $». Суммы целые: копеек в абонплате не бывает. */
export function money(amount: number, currency: Currency = "rub"): string {
  return `${amount.toLocaleString("ru-RU")} ${SIGN[currency]}`;
}

/**
 * «500 ₽/мес» или «1 200 ₽». Сумма без периодичности читается неверно: 500 ₽ в
 * месяц у хостинга и 500 ₽ в год у домена — это разные деньги.
 */
export function fee(
  amount: number,
  monthly: boolean,
  currency: Currency = "rub",
): string {
  return monthly ? `${money(amount, currency)}/мес` : money(amount, currency);
}

/** Итоги по валютам одной строкой: «120 000 ₽ и 1 500 $». */
export function formatTotals(totals: Partial<Record<Currency, number>>): string {
  return CURRENCIES.filter(({ value }) => totals[value])
    .map(({ value }) => money(totals[value]!, value))
    .join(" и ");
}

/** Сложить по валютам. Ноль в валюту не попадает: «0 $» рядом с рублями — шум. */
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
