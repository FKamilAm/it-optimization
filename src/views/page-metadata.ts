import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BRAND_NAME, LOCALE_OG, OG_IMAGE, type Locale } from "@/i18n/config";
import { alternates } from "@/i18n/routes";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Метаданные страницы раздела: title, description, canonical, hreflang и
 * OpenGraph. Один помощник на все страницы — иначе этот блок переписывался бы
 * семь раз и однажды в одном из них забыли бы hreflang.
 *
 * `path` — построитель адреса, а не готовая строка: из него собираются и
 * canonical текущей локали, и список переводов. Так ссылка на перевод не
 * может разойтись с самой страницей.
 */
export async function pageMetadata({
  locale,
  namespace,
  path,
  titleKey = "metaTitle",
  descriptionKey = "metaDescription",
  noindex = false,
}: {
  locale: Locale;
  namespace: string;
  path: (locale: Locale) => string;
  titleKey?: string;
  descriptionKey?: string;
  noindex?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path(locale)}`;
  const languages = Object.fromEntries(
    Object.entries(alternates(path)).map(([key, value]) => [key, `${siteUrl}${value}`]),
  );

  return {
    title: t(titleKey),
    description: t(descriptionKey),
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": `${siteUrl}${path("ru")}` },
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: t(titleKey),
      description: t(descriptionKey),
      url,
      type: "website",
      locale: LOCALE_OG[locale],
      siteName: BRAND_NAME[locale],
      images: [{ url: OG_IMAGE[locale], width: 1200, height: 630 }],
    },
  };
}

/** То же, но заголовок и описание уже готовы — для страниц услуг и статей. */
export function contentMetadata({
  locale,
  title,
  description,
  path,
  noindex = false,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: (locale: Locale) => string;
  noindex?: boolean;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path(locale)}`;
  const languages = Object.fromEntries(
    Object.entries(alternates(path)).map(([key, value]) => [key, `${siteUrl}${value}`]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": `${siteUrl}${path("ru")}` },
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: LOCALE_OG[locale],
      siteName: BRAND_NAME[locale],
      images: [{ url: OG_IMAGE[locale], width: 1200, height: 630 }],
    },
  };
}
