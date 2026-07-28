import ru from "../../../messages/ru.json";
import { SERVICE_NAV } from "@/lib/constants";
import { HOME_CASE_COUNT } from "@/lib/cases";

/**
 * Список услуг для панели: ключ плюс название из каталога, в том же порядке,
 * что в шапке сайта. Кейс привязывается к услугам этими ключами (поле
 * `services`), а страница услуги по ним же собирает свои кейсы.
 */
export interface ServiceOption {
  key: string;
  title: string;
}

const ITEMS = ru.services.items as Record<string, { title?: string }>;

export const SERVICE_OPTIONS: ServiceOption[] = SERVICE_NAV.map((entry) => ({
  key: entry.key,
  title: ITEMS[entry.key]?.title ?? entry.key,
}));

const TITLES = new Map(SERVICE_OPTIONS.map((option) => [option.key, option.title]));

/** Названия услуг кейса — для строки под заголовком в списке. */
export function serviceTitles(keys: readonly string[]): string[] {
  return keys.map((key) => TITLES.get(key) ?? key);
}

/** Позиции внутри стольких первых кейсов показываются и на главной. */
export { HOME_CASE_COUNT };

/**
 * Turn a Russian title into a usable case slug: transliterated, lowercase, dashed.
 * The slug becomes part of the asset filenames, so it must stay ASCII.
 */
const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugifyCaseSlug(title: string): string {
  const latin = Array.from(title.toLowerCase())
    .map((char) => TRANSLIT[char] ?? char)
    .join("");
  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Append -2, -3, … until the slug is free. */
export function uniqueCaseSlug(base: string, taken: readonly string[]): string {
  const seed = base || "case";
  if (!taken.includes(seed)) return seed;
  for (let i = 2; ; i += 1) {
    const candidate = `${seed}-${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
}
