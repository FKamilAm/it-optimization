import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ServicePageContent } from "@/components/service-page/service-page-content";
import { SERVICE_PAGES, SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamicParams = false;

const ENTRIES = Object.entries(SERVICE_PAGES) as [string, string][];

function pageKeyForSlug(slug: string): string | undefined {
  return ENTRIES.find(([, value]) => value === slug)?.[0];
}

export function generateStaticParams() {
  return ENTRIES.map(([, slug]) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageKey = pageKeyForSlug(slug);
  if (!pageKey) return {};

  const t = await getTranslations(`servicePages.${pageKey}`);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/${slug}/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: url },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      locale: "ru_RU",
      siteName: SITE.name,
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const pageKey = pageKeyForSlug(slug);
  if (!pageKey) notFound();

  const t = await getTranslations(`servicePages.${pageKey}`);
  const c = await getTranslations("servicePages.common");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/${slug}/`;
  const faq = t.raw("faq") as { question: string; answer: string }[];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: t("h1"),
      serviceType: t("breadcrumb"),
      description: t("metaDescription"),
      url,
      provider: {
        "@type": "Organization",
        name: SITE.name,
        url: siteUrl,
      },
      areaServed: { "@type": "Country", name: "Россия" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: c("breadcrumbHome"),
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: c("breadcrumbServices"),
          item: `${siteUrl}/#services`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: t("breadcrumb"),
          item: url,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell>
        <ServicePageContent pageKey={pageKey} />
      </SiteShell>
    </>
  );
}
