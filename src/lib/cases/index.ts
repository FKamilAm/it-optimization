export {
  HOME_CASE_COUNT,
  TAG_SEPARATOR,
  casesForService,
  countCasesByService,
  formatTags,
  pickCases,
  type CaseItem,
} from "./types";
export { caseRepository, type CaseRepository } from "./repository";
export { translateCase, translateCases } from "./translate";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { caseRepository } from "./repository";
import { translateCases } from "./translate";
import { HOME_CASE_COUNT, type CaseItem } from "./types";

/**
 * Все кейсы — для /proekty и для страниц услуг.
 *
 * Локаль необязательна и по умолчанию русская: так старые вызовы продолжают
 * работать, а перевод подставляется там, где о нём попросили.
 */
export async function getAllCases(locale: Locale = DEFAULT_LOCALE): Promise<CaseItem[]> {
  return translateCases(await caseRepository.list(), locale);
}

/** Витрина на главной. */
export async function getHomeCases(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CaseItem[]> {
  return translateCases(await caseRepository.listFeatured(HOME_CASE_COUNT), locale);
}
