import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import { ForbiddenPage, forbiddenMetadata } from "@/views/forbidden-page";

/**
 * 403 языковых версий. Статическая папка рядом с динамическим [section]:
 * у неё приоритет, и /en/403/ не уходит в разбор разделов.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return forbiddenMetadata(locale as Locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return <ForbiddenPage locale={locale as Locale} />;
}
