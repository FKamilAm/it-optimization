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

import { caseRepository } from "./repository";
import { HOME_CASE_COUNT, type CaseItem } from "./types";

/** Все кейсы — для /proekty и для страниц услуг. */
export function getAllCases(): Promise<CaseItem[]> {
  return caseRepository.list();
}

/** Витрина на главной. */
export function getHomeCases(): Promise<CaseItem[]> {
  return caseRepository.listFeatured(HOME_CASE_COUNT);
}
