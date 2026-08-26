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
      onChange={(next) => onChange(next as Currency)}
      options={CURRENCIES.map((currency) => ({
        value: currency.value,
        label: currency.label,
      }))}
      disabled={disabled}
      ariaLabel="Валюта"
      className="w-20 shrink-0"
    />
  );
}
