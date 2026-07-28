import ru from "../../../messages/ru.json";
import { HOME_CASE_COUNT } from "@/lib/cases";

/**
 * Service pages reference cases by slug (`servicePages.<page>.cases` in the message
 * catalog), and those references live outside the panel's reach. The panel uses
 * this map to warn before deleting a case that a service page still points at —
 * the build tolerates a dangling key (see `getCases`), the page just shows one
 * case fewer.
 */
type ServicePages = Record<string, { breadcrumb?: string; cases?: string[] }>;

const USAGE: Record<string, string[]> = {};

for (const [pageKey, page] of Object.entries(ru.servicePages as ServicePages)) {
  if (pageKey === "common") continue;
  for (const caseSlug of page.cases ?? []) {
    (USAGE[caseSlug] ??= []).push(page.breadcrumb ?? pageKey);
  }
}

/** Human-readable names of the service pages showing this case. */
export function servicePagesUsing(caseSlug: string): string[] {
  return USAGE[caseSlug] ?? [];
}

/** Positions inside this many first cases are also shown on the homepage. */
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
