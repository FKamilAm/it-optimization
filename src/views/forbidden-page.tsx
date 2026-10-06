import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorScreen } from "@/components/error-pages/error-screen";
import { logoFor } from "@/components/layout/logo";
import { BRAND_NAME, type Locale } from "@/i18n/config";
import { homePath } from "@/i18n/routes";

/**
 * Страница 403 — тот же экран, что 404: код из полос, одна строка, кнопка
 * «На главную».
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
    title: `403 — ${t("meta")}`,
    robots: { index: false, follow: false },
  };
}

export async function ForbiddenPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "errorPages.forbidden" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const a11y = await getTranslations({ locale, namespace: "a11y" });
  const home = homePath(locale);

  return (
    <ErrorScreen
      code="403"
      title={t("title")}
      home={{ label: t("home"), href: home }}
      header={{
        home,
        logoSrc: logoFor(locale).src,
        logoAlt: BRAND_NAME[locale],
        logoLabel: a11y("logo"),
        cta: nav("cta"),
        ctaHref: `${home}#contact`,
      }}
    />
  );
}
