import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ServicesHubContent } from "@/components/services/services-hub-content";
import { SERVICE_NAV, SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("servicesPage");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/`;

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

export default async function ServicesPage() {
  const t = await getTranslations("servicesPage");
  const services = await getTranslations("services.items");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/`;
  const faq = t.raw("faq") as { question: string; answer: string }[];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("breadcrumbHome"),
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("breadcrumb"),
          item: url,
        },
      ],
    },
    // Список услуг разметкой — он же и есть содержимое страницы. Каждый пункт
    // ведёт на свою /uslugi/<slug>/, так что хаб заодно объясняет поисковику
    // структуру раздела, а не только перелинковывает его ссылками.
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("metaTitle"),
      numberOfItems: SERVICE_NAV.length,
      itemListElement: SERVICE_NAV.map(({ key, slug }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: services(`${key}.title`),
        url: `${siteUrl}/uslugi/${slug}/`,
      })),
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
        <ServicesHubContent />
      </SiteShell>
    </>
  );
}
