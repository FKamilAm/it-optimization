/**
 * Форма одной страницы услуги. Раньше эти тексты лежали в каталоге
 * `messages/ru.json` (блок `servicePages`), а каталог отдаётся клиенту целиком
 * на каждой странице сайта — так главная и блог тащили тарифы и FAQ всех
 * услуг. Теперь это данные: страница читает свою запись и получает её пропсом,
 * ровно как кейсы и статьи.
 *
 * Поля повторяют будущую таблицу `services` (см. docs/backend.md), чтобы
 * переезд в PostgreSQL был переносом данных, а не сменой формы.
 */
export interface ServicePage {
  /**
   * Вечный идентификатор услуги — он же ключ в `SERVICE_PAGES`. Здесь это
   * важнее, чем uuid у кейса: на ключ ссылаются статьи блога (`services`),
   * кейсы (`services`), 3D-сцены героя и поле `Lead.service` в CRM. Ключ
   * переживает переименование slug, менять его нельзя без правки всех четырёх.
   */
  key: string;
  /** Адрес страницы: /uslugi/<slug>/. Дублирует `SERVICE_PAGES` — см. репозиторий. */
  slug: string;
  metaTitle: string;
  metaDescription: string;
  /** Короткое имя услуги в хлебных крошках. */
  breadcrumb: string;
  h1: string;
  lead: string;
  /** Пункты блока «Что входит в разработку». */
  includes: string[];
  forWhom: ServicePageCard[];
  steps: ServicePageCard[];
  faq: ServicePageFaq[];
  /** Блок тарифов. Необязателен: услуга без фиксированных пакетов его не показывает. */
  tariffs?: ServiceTariff[];
}

export interface ServicePageCard {
  title: string;
  text: string;
}

export interface ServicePageFaq {
  question: string;
  answer: string;
}

export interface ServiceTariff {
  name: string;
  price: string;
  deadline: string;
  /** Выделенный тариф — ровно один на услугу. */
  recommended?: boolean;
  features: string[];
}

/**
 * Границы цен из тарифов — для `AggregateOffer` в микроразметке.
 *
 * Цена хранится строкой («от 120 000 ₽», «от 40 000 ₽/мес»), потому что на
 * странице она так и показывается; для разметки из неё вынимаются цифры.
 * Услуга без тарифов и услуга с нечисловой ценой дают `undefined` — блок
 * `offers` тогда просто не выводится.
 */
export function tariffPriceRange(
  tariffs: readonly ServiceTariff[] | undefined,
): { lowPrice: number; highPrice: number; offerCount: number } | undefined {
  const prices = (tariffs ?? [])
    .map((tier) => Number(tier.price.replace(/[^\d]/g, "")))
    .filter((price) => price > 0);
  if (!prices.length) return undefined;

  return {
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: prices.length,
  };
}

/**
 * Каталог услуг — структура раздела /uslugi/, отдельно от текстов страниц.
 *
 * Живёт в `content/service-catalog.json`, правится в /panel и намеренно
 * маленький: его импортируют клиентские компоненты (меню в хедере, карточка
 * услуги, каталог), а тексты всех страниц в браузер тащить нельзя.
 */
export interface ServiceCatalog {
  categories: ServiceCategoryRecord[];
  services: ServiceCatalogEntry[];
}

/** Раздел каталога: кнопка фильтра на /uslugi/, а не маршрут. */
export interface ServiceCategoryRecord {
  key: string;
  title: string;
}

export interface ServiceCatalogEntry {
  /** Ключ услуги — он же ключ записи в `content/services.json`. */
  key: string;
  /** Адрес страницы: /uslugi/<slug>/. */
  slug: string;
  /** Ключ раздела из `categories`. */
  category: string;
  /**
   * Черновик: страница собирается и открывается по адресу, но не попадает ни в
   * каталог, ни в меню, ни в карту сайта, и отдаётся с `noindex`.
   */
  draft: boolean;
}
