/** «120000» → «120 000 ₽». Суммы в CRM всегда в рублях и всегда целые. */
export function money(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

/**
 * «500 ₽/мес» или «1 200 ₽». Сумма без периодичности читается неверно: 500 ₽ в
 * месяц у хостинга и 500 ₽ в год у домена — это разные деньги.
 */
export function fee(amount: number, monthly: boolean): string {
  return monthly ? `${money(amount)}/мес` : money(amount);
}
