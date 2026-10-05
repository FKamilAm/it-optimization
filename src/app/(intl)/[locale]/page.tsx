import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import { HomePage } from "@/views/home-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return <HomePage locale={locale as Locale} />;
}
