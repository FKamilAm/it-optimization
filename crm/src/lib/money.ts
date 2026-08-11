/** «120000» → «120 000 ₽». Суммы в CRM всегда в рублях и всегда целые. */
export function money(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}
