import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CursorFollower } from "@/components/layout/cursor-follower";
import { LocaleRedirect } from "@/components/layout/locale-redirect";
import { StructuredData } from "@/components/seo/structured-data";
import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HTML_LANG,
  LOCALE_OG,
  localePath,
  type Locale,
} from "@/i18n/config";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import "../app/globals.css";

/**
 * Общая оболочка сайта: шрифты, провайдер строк, микроразметка, тег <html>.
 *
 * Живёт отдельным модулем, потому что корневых макетов теперь два — по одному
 * на группу маршрутов, (ru) и (intl). Разводить их пришлось ради атрибута
 * `lang`: в App Router <html> рисует корневой макет, а он не видит сегмент
 * адреса и локаль узнать не может. Два макета, одна оболочка — иначе правка
 * шапки делалась бы дважды и однажды разошлась бы.
 */

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["900"],
  variable: "--font-unbounded",
  display: "swap",
});

/**
 * Метаданные корня для локали.
 *
 * `alternates.languages` — это и есть hreflang: поисковику говорят, что три
 * адреса не дубликаты, а переводы одной страницы. Без него английская версия
 * конкурирует с русской за один запрос и обе проигрывают. `x-default`
 * указывает на русскую: она в корне и остаётся вариантом по умолчанию для
 * тех, чей язык в списке не значится.
 */
export async function buildRootMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${localePath(locale, "/")}`;
  const keywords = t("keywords")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const languages = Object.fromEntries(
    LOCALES.map((item) => [item, `${siteUrl}${localePath(item, "/")}`]),
  );

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: `%s — ${BRAND_NAME[locale]}`,
    },
    description: t("description"),
    keywords,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": `${siteUrl}/` },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: LOCALE_OG[locale],
      type: "website",
      url,
      siteName: BRAND_NAME[locale],
      images: [
        { url: "/og-image.webp", width: 1200, height: 630, alt: t("ogImageAlt") },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.webp"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
    icons: {
      icon: [
        {
          url: "/favicon_black.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon_white.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      shortcut: "/favicon_black.svg",
      apple: "/favicon_black.svg",
    },
  };
}

export async function RootShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale });

  return (
    <html lang={LOCALE_HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        {/* Только на русских страницах: они в корне, и именно сюда попадает
            посетитель, не выбиравший язык. На /en/ и /es/ он уже пришёл
            осознанно — либо по ссылке, либо этим же скриптом, и повторно
            решать за него нечего. */}
        {locale === DEFAULT_LOCALE && <LocaleRedirect />}
      </head>
      <body className={`${manrope.variable} ${unbounded.variable} font-sans antialiased`}>
        <StructuredData />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CursorFollower />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
