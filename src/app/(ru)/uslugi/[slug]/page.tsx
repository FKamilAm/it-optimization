import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { serviceKeyBySlug, servicePath } from "@/i18n/routes";
import { DRAFT_SERVICES, SERVICE_PAGES } from "@/lib/constants";
import { contentMetadata } from "@/views/page-metadata";
import { requireServicePage, ServiceDetailPage } from "@/views/service-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(SERVICE_PAGES).map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = serviceKeyBySlug(slug, DEFAULT_LOCALE);
  if (!key) notFound();
  const page = await requireServicePage(key);

  return contentMetadata({
    locale: DEFAULT_LOCALE,
    title: page.metaTitle,
    description: page.metaDescription,
    path: (locale) => servicePath(key, locale),
    // Черновик собирается и открывается по прямой ссылке — так его можно
    // показать и вычитать, — но в поиск ему рано.
    noindex: DRAFT_SERVICES.has(key),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const key = serviceKeyBySlug(slug, DEFAULT_LOCALE);
  if (!key) notFound();
  setRequestLocale(DEFAULT_LOCALE);
  return <ServiceDetailPage locale={DEFAULT_LOCALE} serviceKey={key} />;
}
