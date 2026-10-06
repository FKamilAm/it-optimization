import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorActions } from "@/components/error-pages/error-actions";
import { ErrorHeader } from "@/components/error-pages/error-header";
import { AccessPortal } from "@/components/error-pages/forbidden/access-portal";
import { logoFor } from "@/components/layout/logo";
import { BRAND_NAME, type Locale } from "@/i18n/config";
import { homePath } from "@/i18n/routes";

/**
 * Страница 403 — «пространство существует, но проход закрыт».
 *
 * Отдельный маршрут (/403/, /en/403/, /es/403/), а не forbidden() из Next:
 * тот требует серверного рантайма, а сайт — статический экспорт. Статическая
 * страница не может сама вернуть код 403 — это делает веб-сервер, когда
 * отказывает в доступе, например в nginx:
 *
 *     error_page 403 /403/;            # для /en/… и /es/… — их версии
 *
 * Тогда посетитель видит эту страницу, а поисковик и браузер получают
 * честный код ответа.
 */

export async function forbiddenMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "errorPages.forbidden" });
  return {
    title: `403 — ${t("title")}`,
    robots: { index: false, follow: false },
  };
}

export async function ForbiddenPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "errorPages.forbidden" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const a11y = await getTranslations({ locale, namespace: "a11y" });
  const home = homePath(locale);

  return (
    <div className="e403-page relative isolate min-h-svh overflow-hidden text-white">
      {/* Фон: сетка, шум и виньетка — всё декоративное скрыто от скринридера. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="e403-grid absolute inset-0" />
        <div className="e403-noise absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
        {/* Число — техническая маркировка в углу, а не главный объект. */}
        <span className="e403-mark font-display absolute bottom-[4svh] left-[var(--spacing-container)] hidden font-black text-white lg:block">
          403
        </span>
      </div>

      <ErrorHeader
        dark
        home={home}
        logoSrc={logoFor(locale).src}
        logoAlt={BRAND_NAME[locale]}
        logoLabel={a11y("logo")}
        cta={nav("cta")}
        ctaHref={`${home}#contact`}
      />

      <main
        id="main"
        className="container-premium relative z-10 flex min-h-svh flex-col items-center justify-center gap-10 pt-24 pb-12 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12 lg:pt-20"
      >
        <div className="order-2 w-full max-w-lg lg:order-1">
          <p className="font-display text-sm tracking-[0.3em] text-white/35 lg:hidden">
            403
          </p>
          <h1 className="heading-section mt-3 lg:mt-0">{t("title")}</h1>
          <p className="body-large mt-4 text-white/65">{t("text")}</p>
          <div className="mt-8">
            <ErrorActions
              dark
              home={{ label: t("home"), href: home }}
              secondary={{ label: t("back"), back: true }}
            />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:justify-self-center">
          <AccessPortal />
        </div>
      </main>
    </div>
  );
}
