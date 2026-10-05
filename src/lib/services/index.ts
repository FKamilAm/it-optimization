export {
  tariffPriceRange,
  type ServicePage,
  type ServicePageCard,
  type ServicePageFaq,
  type ServiceTariff,
} from "./types";
export { servicePageRepository, type ServicePageRepository } from "./repository";
export { translateServicePage, translateServicePages } from "./translate";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { servicePageRepository } from "./repository";
import { translateServicePage, translateServicePages } from "./translate";
import type { ServicePage } from "./types";

/** Все страницы услуг — для хаба и будущей панели. */
export async function getAllServicePages(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ServicePage[]> {
  return translateServicePages(await servicePageRepository.list(), locale);
}

/**
 * Страница одной услуги по ключу из каталога.
 *
 * Локаль необязательна и по умолчанию русская: перевода может ещё не быть —
 * страница всё равно откроется, просто по-русски.
 */
export async function getServicePage(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ServicePage | undefined> {
  const page = await servicePageRepository.byKey(key);
  return page && translateServicePage(page, locale);
}

/** Страница одной услуги по адресу — так её ищет роут /uslugi/[slug]. */
export function getServicePageBySlug(slug: string): Promise<ServicePage | undefined> {
  return servicePageRepository.bySlug(slug);
}
