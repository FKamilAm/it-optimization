import { Select } from "@/components/ui";
import { CURRENCIES, type Currency } from "@/lib/money";

/**
 * Переключатель валюты рядом с суммой.
 *
 * Стоит именно рядом с полем, а не в шапке формы: валюта — свойство самой
 * суммы, а не записи целиком. У проекта в долларах вполне может быть счёт,
 * выставленный в рублях.
 */
export function CurrencySelect({
  value,
  onChange,
  disabled,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value as Currency)}
      disabled={disabled}
      aria-label="Валюта"
      className="w-16 shrink-0"
    >
      {CURRENCIES.map((currency) => (
        <option key={currency.value} value={currency.value}>
          {currency.label}
        </option>
      ))}
    </Select>
  );
}
