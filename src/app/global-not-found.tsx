import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, PREFIXED_LOCALES, type Locale } from "@/i18n/config";
import { homePath } from "@/i18n/routes";
import { manrope, unbounded } from "@/views/fonts";
import "./globals.css";

/**
 * Страница 404 — одна на все языки.
 *
 * Корневых макетов два, (ru) и (intl), и обычный not-found.tsx при таком
 * устройстве в экспорт не попадает: вместо него Next клал в out/404.html
 * свою заглушку без стилей, «404: This page could not be found.», и её видели
 * все — в том числе русские посетители. global-not-found.tsx (флаг
 * experimental.globalNotFound) рисует свой <html> и становится этим 404.html.
 *
 * Файл один, а хостинг отдаёт его на любой несуществующий адрес — и на
 * /en/…, и на /es/…. Поэтому язык выбирается в браузере по адресу: в разметке
 * лежат все три версии, скрипт до отрисовки ставит data-locale на <html>, и
 * CSS показывает нужную. Без мигания русским текстом и без React на клиенте.
 */

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

const script = `(function(){var m=/^\\/(${PREFIXED_LOCALES.join("|")})(\\/|$)/.exec(location.pathname);var l=m?m[1]:${JSON.stringify(DEFAULT_LOCALE)};document.documentElement.setAttribute("data-locale",l);document.documentElement.lang=l;})();`;

// Без скрипта (или пока он не отработал) видна русская версия.
const css = [
  "[data-not-found]{display:none}",
  `html:not([data-locale]) [data-not-found="${DEFAULT_LOCALE}"]`,
  ...LOCALES.map((l) => `,html[data-locale="${l}"] [data-not-found="${l}"]`),
  "{display:flex}",
].join("");

export default async function GlobalNotFound() {
  const texts = await Promise.all(
    LOCALES.map(async (locale: Locale) => {
      const t = await getTranslations({ locale, namespace: "notFound" });
      return { locale, title: t("title"), home: t("home") };
    }),
  );

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body className={`${manrope.variable} ${unbounded.variable} font-sans antialiased`}>
        {texts.map(({ locale, title, home }) => (
          <main
            key={locale}
            data-not-found={locale}
            lang={locale}
            className="min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <p className="text-muted-foreground text-base tracking-[0.2em] uppercase">
              404
            </p>
            <h1 className="heading-subsection">{title}</h1>
            <a
              href={homePath(locale)}
              className="border-border hover:border-foreground rounded-full border px-6 py-3 text-base transition-colors"
            >
              {home}
            </a>
          </main>
        ))}
      </body>
    </html>
  );
}
