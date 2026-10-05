"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LOCALES,
  LOCALE_NAMES,
  LOCALE_STORAGE_KEY,
  isLocale,
  splitLocalePath,
  type Locale,
} from "@/i18n/config";
import { translatePath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Переключатель языка.
 *
 * Ссылки ведут на тот же адрес в другой локали. Это не снятие префикса:
 * у разделов и страниц свои слуги в каждом языке, и `/en/services/
 * crm-development/` без настоящего перевода превращается в
 * `/services/crm-development/` — адрес, которого не существует. Поэтому путь
 * разбирается в описание страницы и собирается заново на нужном языке
 * (`translatePath`), и со страницы услуги посетитель попадает на её перевод.
 *
 * Страница, у которой перевода нет, уводит на главную нужного языка: это
 * лучше, чем ссылка в 404.
 *
 * Клик записывает выбор в localStorage, и с этого момента автоопределение
 * языка молчит навсегда (см. `locale-redirect.tsx`). Это и есть главная
 * причина, по которой переключатель обязан существовать: без него человек,
 * которого скрипт увёл на чужой язык, не смог бы вернуться — его перекидывало
 * бы снова при каждом заходе.
 *
 * Обычные `<a>`, а не `<Link>`: при смене языка нужна полная перезагрузка.
 * Клиентский переход оставил бы в памяти каталог строк предыдущей локали,
 * потому что провайдер с сообщениями живёт в корневом макете.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = useLocale();
  const current: Locale = isLocale(active) ? active : splitLocalePath(pathname).locale;

  const remember = (locale: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Приватный режим умеет бросать прямо на записи. Переключение языка
      // важнее запоминания выбора, поэтому просто идём дальше.
    }
  };

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={LOCALE_NAMES[current]}
    >
      {LOCALES.map((locale) => {
        const isActive = locale === current;
        return (
          <a
            key={locale}
            href={translatePath(pathname, locale)}
            hrefLang={locale}
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            onClick={() => remember(locale)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-300",
              isActive
                ? "bg-accent text-black"
                : "text-white/50 hover:text-accent cursor-pointer",
            )}
          >
            {locale}
          </a>
        );
      })}
    </div>
  );
}
