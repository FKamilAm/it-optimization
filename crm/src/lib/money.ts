/**
 * Деньги в CRM.
 *
 * Суммы хранятся и передаются **в минорных единицах** — копейках и центах,
 * целым числом. Дробные деньги обычным числом с плавающей точкой считать
 * нельзя: 0.1 + 0.2 там не равно 0.3, и на суммах это вылезает расхождением в
 * копейку. Поэтому арифметика целочисленная, а дробь появляется только при
 * выводе и разборе того, что набрал человек.
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

/**
 * Минорные единицы → «120 000 ₽», «5,19 $». Дробная часть показывается только
 * когда она есть: «45 000 ₽» читается лучше, чем «45 000,00 ₽».
 */
export function money(minor: number, currency: Currency = "rub"): string {
  // Либо копеек нет вовсе, либо их две: «0,3 ₽» для денег выглядит обрубком.
  const text = (minor / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${text} ${SIGN[currency]}`;
}

/**
 * Что разрешено набирать в поле суммы: цифры и один разделитель, не больше
 * двух знаков после него. Точка приводится к запятой — на русской раскладке
 * жмут и то и другое, а спорить с человеком из-за клавиши незачем.
 */
export function sanitizeAmount(text: string): string {
  const parts = text
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, ",")
    .split(",");
  const whole = parts[0] ?? "";
  const rest = parts.slice(1);
  return rest.length === 0 ? whole : `${whole},${rest.join("").slice(0, 2)}`;
}

/** «5,19» → 519 минорных единиц. Пусто → null: сумму можно не указывать. */
export function parseAmount(text: string): number | null {
  const clean = sanitizeAmount(text);
  if (!clean || clean === ",") return null;
  const [whole, fraction = ""] = clean.split(",");
  return Number(whole || 0) * 100 + Number(fraction.padEnd(2, "0"));
}

/** 519 → «5,19». Для поля ввода, поэтому без разделителей тысяч. */
export function amountToInput(minor: number | null | undefined): string {
  if (minor == null) return "";
  const rest = minor % 100;
  return rest
    ? `${Math.trunc(minor / 100)},${String(rest).padStart(2, "0")}`
    : String(Math.trunc(minor / 100));
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
  rows: { amountMinor: number | null; currency: Currency }[],
): Partial<Record<Currency, number>> {
  const totals: Partial<Record<Currency, number>> = {};
  for (const row of rows) {
    if (!row.amountMinor) continue;
    totals[row.currency] = (totals[row.currency] ?? 0) + row.amountMinor;
  }
  return totals;
}
