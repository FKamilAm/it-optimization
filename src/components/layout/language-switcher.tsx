"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LOCALES,
  LOCALE_NAMES,
  LOCALE_STORAGE_KEY,
  isLocale,
  localePath,
  splitLocalePath,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Переключатель языка.
 *
 * Ссылки ведут на тот же адрес в другой локали: текущий путь разбирается на
 * префикс и остаток, подставляется новый префикс. Поэтому со страницы услуги
 * посетитель попадает на её же перевод, а не на главную — промах, из-за
 * которого переключателями обычно пользуются один раз.
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
  const { path } = splitLocalePath(pathname);

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
            href={localePath(locale, path)}
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
