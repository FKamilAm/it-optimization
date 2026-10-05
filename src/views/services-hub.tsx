import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ServicesHubContent } from "@/components/services/services-hub-content";
import type { Locale } from "@/i18n/config";
import { homePath, servicePath, servicesPath } from "@/i18n/routes";
import { SERVICE_NAV } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

/** Хаб услуг. Разметка ItemList объясняет поисковику структуру раздела. */
export async function ServicesHub({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "servicesPage" });
  const services = await getTranslations({ locale, namespace: "services.items" });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${servicesPath(locale)}`;
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
          item: `${siteUrl}${homePath(locale)}`,
        },
        { "@type": "ListItem", position: 2, name: t("breadcrumb"), item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("metaTitle"),
      numberOfItems: SERVICE_NAV.length,
      itemListElement: SERVICE_NAV.map(({ key }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: services(`${key}.title`),
        url: `${siteUrl}${servicePath(key, locale)}`,
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
