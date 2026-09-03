export {
  tariffPriceRange,
  type ServicePage,
  type ServicePageCard,
  type ServicePageFaq,
  type ServiceTariff,
} from "./types";
export { servicePageRepository, type ServicePageRepository } from "./repository";

import { servicePageRepository } from "./repository";
import type { ServicePage } from "./types";

/** Все страницы услуг — для хаба и будущей панели. */
export function getAllServicePages(): Promise<ServicePage[]> {
  return servicePageRepository.list();
}

/** Страница одной услуги по ключу из `SERVICE_PAGES`. */
export function getServicePage(key: string): Promise<ServicePage | undefined> {
  return servicePageRepository.byKey(key);
}

/** Страница одной услуги по адресу — так её ищет роут /uslugi/[slug]. */
export function getServicePageBySlug(slug: string): Promise<ServicePage | undefined> {
  return servicePageRepository.bySlug(slug);
}
