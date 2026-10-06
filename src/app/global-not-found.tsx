import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorActions } from "@/components/error-pages/error-actions";
import { ErrorHeader } from "@/components/error-pages/error-header";
import { Broken404Scene } from "@/components/error-pages/not-found/broken-404-scene";
import { CursorFollower } from "@/components/layout/cursor-follower";
import { logoFor } from "@/components/layout/logo";
import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  PREFIXED_LOCALES,
  type Locale,
} from "@/i18n/config";
import { homePath, servicesPath } from "@/i18n/routes";
import { manrope, unbounded } from "@/views/fonts";
import "./globals.css";

/**
 * Страница 404 — одна на все языки: «часть системы потерялась».
 *
 * Корневых макетов два, (ru) и (intl), и обычный not-found.tsx при таком
 * устройстве в экспорт не попадает. global-not-found.tsx (флаг
 * experimental.globalNotFound) рисует свой <html> и становится out/404.html —
 * это родной механизм Next, а не редирект на /404.
 *
 * Файл один, а хостинг отдаёт его на любой несуществующий адрес — и на
 * /en/…, и на /es/…. Поэтому язык выбирается в браузере по адресу: скрипт до
 * отрисовки ставит data-locale на <html>, и CSS показывает шапку и текст
 * нужного языка. Сцена от языка не зависит и рисуется один раз. Провайдера
 * next-intl здесь нет (он живёт в корневых макетах), поэтому строки всех
 * трёх языков приходят с сервера готовыми — это несколько строк, а не
 * каталог целиком.
 *
 * Отдаёт ли сервер 404.html на несуществующие адреса — настройка хостинга:
 * для nginx это `error_page 404 /404.html;`.
 */

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

const script = `(function(){var m=/^\\/(${PREFIXED_LOCALES.join("|")})(\\/|$)/.exec(location.pathname);var l=m?m[1]:${JSON.stringify(DEFAULT_LOCALE)};document.documentElement.setAttribute("data-locale",l);document.documentElement.lang=l;})();`;

// Без скрипта (или пока он не отработал) видна русская версия.
const css = [
  "[data-locale-only]{display:none}",
  `html:not([data-locale]) [data-locale-only="${DEFAULT_LOCALE}"]`,
  ...LOCALES.map((l) => `,html[data-locale="${l}"] [data-locale-only="${l}"]`),
  "{display:block}",
].join("");

export default async function GlobalNotFound() {
  const variants = await Promise.all(
    LOCALES.map(async (locale: Locale) => {
      const t = await getTranslations({ locale, namespace: "errorPages.notFound" });
      const nav = await getTranslations({ locale, namespace: "nav" });
      const a11y = await getTranslations({ locale, namespace: "a11y" });
      return {
        locale,
        title: t("title"),
        text: t("text"),
        home: t("home"),
        services: t("services"),
        cta: nav("cta"),
        logoLabel: a11y("logo"),
      };
    }),
  );

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body className={`${manrope.variable} ${unbounded.variable} font-sans antialiased`}>
        <CursorFollower />
        <div className="e404-page text-foreground relative isolate min-h-svh overflow-hidden">
          <Broken404Scene />

          {variants.map((v) => (
            <div key={v.locale} data-locale-only={v.locale} lang={v.locale}>
              <ErrorHeader
                home={homePath(v.locale)}
                logoSrc={logoFor(v.locale).src}
                logoAlt={BRAND_NAME[v.locale]}
                logoLabel={v.logoLabel}
                cta={v.cta}
                ctaHref={`${homePath(v.locale)}#contact`}
              />
              <main className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[max(2.5rem,6svh)]">
                <div className="container-premium">
                  <div className="pointer-events-auto max-w-md">
                    <p className="font-display text-foreground/35 text-sm tracking-[0.3em]">
                      404
                    </p>
                    <h1 className="heading-section mt-3">{v.title}</h1>
                    <p className="body-large text-foreground/65 mt-3">{v.text}</p>
                    <div className="mt-7">
                      <ErrorActions
                        home={{ label: v.home, href: homePath(v.locale) }}
                        secondary={{ label: v.services, href: servicesPath(v.locale) }}
                      />
                    </div>
                  </div>
                </div>
              </main>
            </div>
          ))}
        </div>
      </body>
    </html>
  );
}
