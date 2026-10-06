import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  NotFoundExperience,
  type NotFoundVariant,
} from "@/components/error-pages/not-found-experience";
import { CursorFollower } from "@/components/layout/cursor-follower";
import { logoFor } from "@/components/layout/logo";
import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  PREFIXED_LOCALES,
  type Locale,
} from "@/i18n/config";
import { homePath } from "@/i18n/routes";
import { manrope, unbounded } from "@/views/fonts";
import "./globals.css";

/**
 * Страница 404 — одна на весь сайт: код из полос, одна строка и «На главную».
 *
 * Корневых макетов два, (ru) и (intl), и обычный not-found.tsx при таком
 * устройстве в экспорт не попадает. global-not-found.tsx (флаг
 * experimental.globalNotFound) рисует свой <html> и становится out/404.html —
 * это родной механизм Next, а не редирект на /404.
 *
 * Файл один, а хостинг отдаёт его на любой несуществующий адрес — и на
 * /en/…, и на /es/…. Язык берётся из адреса: скрипт в <head> ставит
 * data-locale до отрисовки, а NotFoundExperience рисует только этот язык.
 * Строки трёх языков приходят с сервера данными — провайдера next-intl здесь
 * нет, он живёт в корневых макетах.
 *
 * Код ответа 404 и сам показ этой страницы на несуществующих адресах — дело
 * веб-сервера: для nginx это `error_page 404 /404.html;`. Без этой строки
 * nginx честно отвечает 404, но своей заглушкой.
 */

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

const script = `(function(){var m=/^\\/(${PREFIXED_LOCALES.join("|")})(\\/|$)/.exec(location.pathname);var l=m?m[1]:${JSON.stringify(DEFAULT_LOCALE)};document.documentElement.setAttribute("data-locale",l);document.documentElement.lang=l;})();`;

// На /en/ и /es/ до гидрации шапка и текст скрыты, чтобы не мелькал русский.
const css = `${PREFIXED_LOCALES.map((l) => `html[data-locale="${l}"] [data-i18n-pending] :is(header,main)`).join(",")}{visibility:hidden}`;

export default async function GlobalNotFound() {
  const entries = await Promise.all(
    LOCALES.map(async (locale: Locale): Promise<[Locale, NotFoundVariant]> => {
      const t = await getTranslations({ locale, namespace: "errorPages.notFound" });
      const nav = await getTranslations({ locale, namespace: "nav" });
      const a11y = await getTranslations({ locale, namespace: "a11y" });
      const home = homePath(locale);
      return [
        locale,
        {
          title: t("title"),
          home: { label: t("home"), href: home },
          header: {
            home,
            logoSrc: logoFor(locale).src,
            logoAlt: BRAND_NAME[locale],
            logoLabel: a11y("logo"),
            cta: nav("cta"),
            ctaHref: `${home}#contact`,
          },
        },
      ];
    }),
  );
  const variants = Object.fromEntries(entries) as Record<Locale, NotFoundVariant>;

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body className={`${manrope.variable} ${unbounded.variable} font-sans antialiased`}>
        <CursorFollower />
        <NotFoundExperience variants={variants} />
      </body>
    </html>
  );
}
