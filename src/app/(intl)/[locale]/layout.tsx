import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import { buildRootMetadata, RootShell } from "@/views/root-shell";

/**
 * Корневой макет языковых версий — всё, кроме русской, которая живёт в корне.
 *
 * Вторая группа маршрутов со своим <html> нужна ради атрибута `lang`:
 * в App Router его рисует корневой макет, а сегмент адреса виден только
 * отсюда. Так английская страница получает lang="en" прямо в статике.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return buildRootMetadata(locale as Locale);
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // До любого обращения к строкам — иначе next-intl читает заголовок запроса,
  // маршрут становится динамическим и статический экспорт падает.
  setRequestLocale(locale);

  return <RootShell locale={locale as Locale}>{children}</RootShell>;
}
