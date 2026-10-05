"use client";

import { useLocale } from "next-intl";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import {
  blogPath,
  homePath,
  postPath,
  privacyPath,
  projectsPath,
  servicePath,
  servicesPath,
} from "./routes";

/**
 * Внутренние ссылки с учётом языка — для клиентских компонентов.
 *
 * Без него ссылки пишутся как `/uslugi/`, и на английской версии один клик по
 * «Services» выбрасывает посетителя обратно на русский сайт. Ровно так и было
 * до появления этого хука: девятнадцать зашитых русских путей по шапке,
 * подвалу, меню и карточкам.
 *
 * Локаль берётся из `useLocale()`, а он работает, потому что
 * `NextIntlClientProvider` в корневом макете получает её от страницы. Отдельно
 * прокидывать язык пропсами через полдесятка уровней не нужно.
 *
 * Можно импортировать из клиентских компонентов: `routes.ts` тянет за собой
 * только каталог услуг и таблицу слугов — те самые маленькие файлы, которые
 * для этого и отделены от текстов страниц.
 */
export function usePaths() {
  const raw = useLocale();
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    home: homePath(locale),
    services: servicesPath(locale),
    /** Адрес страницы услуги по её ключу — слуг у каждого языка свой. */
    service: (key: string) => servicePath(key, locale),
    projects: projectsPath(locale),
    blog: blogPath(locale),
    /** На вход — русский слуг статьи: он идентификатор, а не адрес. */
    post: (ruSlug: string) => postPath(ruSlug, locale),
    privacy: privacyPath(locale),
  };
}
