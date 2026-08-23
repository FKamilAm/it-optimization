import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

/**
 * Открывает карточку, на которую указывает `?open=<id>` из глобального поиска.
 *
 * Экраны показывают записи в модальных окнах и своих адресов у карточек нет,
 * поэтому поиск переводит в раздел и просит открыть нужную. Ждать приходится
 * загрузки списка: до неё открывать нечего.
 */
export function useOpenFromSearch<T extends { id: string }>(
  items: T[] | null,
  open: (item: T) => void,
): void {
  const [params, setParams] = useSearchParams();
  const wanted = params.get("open");
  // Что уже открывали. Очистка параметра доходит не мгновенно, и без отметки
  // эффект успевает сработать второй раз на том же идентификаторе.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!wanted || !items || handled.current === wanted) return;
    const found = items.find((item) => item.id === wanted);
    if (!found) return;

    handled.current = wanted;
    open(found);
    // Параметр убирается сразу: иначе закрытая карточка открывалась бы снова
    // при каждом обновлении списка, и закрыть её было бы нельзя.
    setParams({}, { replace: true });
  }, [wanted, items, open, setParams]);
}
