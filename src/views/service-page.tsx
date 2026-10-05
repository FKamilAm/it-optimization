import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ServicePageContent } from "@/components/service-page/service-page-content";
import type { Locale } from "@/i18n/config";
import { homePath, servicePath, servicesPath } from "@/i18n/routes";
import { getPostsForService } from "@/lib/blog";
import { getAllCases } from "@/lib/cases";
import { getServicePage, tariffPriceRange } from "@/lib/services";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Страница одной услуги. На вход — ключ, а не слуг: слуг у каждой локали свой
 * («razrabotka-crm», «crm-development», «desarrollo-crm»), а ключ один на все
 * три и именно он связывает страницу с кейсами, статьями и 3D-сценой.
 */
export async function requireServicePage(key: string) {
  const page = await getServicePage(key);
  if (!page) {
    throw new Error(
      `Услуга «${key}» есть в каталоге, но её нет в content/services.json`,
    );
  }
  return page;
}

export async function ServiceDetailPage({
  locale,
  serviceKey,
}: {
  locale: Locale;
  serviceKey: string;
}) {
  const page = await getServicePage(serviceKey);
  if (!page) notFound();

  const c = await getTranslations({ locale, namespace: "servicePages.common" });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${servicePath(serviceKey, locale)}`;

  const range = tariffPriceRange(page.tariffs);
  const offers = range
    ? { "@type": "AggregateOffer", priceCurrency: "RUB", ...range }
    : undefined;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.h1,
      serviceType: page.breadcrumb,
      description: page.metaDescription,
      url,
      provider: { "@type": "Organization", name: SITE.name, url: siteUrl },
      areaServed: { "@type": "Country", name: "Россия" },
      ...(offers ? { offers } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: c("breadcrumbHome"),
          item: `${siteUrl}${homePath(locale)}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: c("breadcrumbServices"),
          item: `${siteUrl}${servicesPath(locale)}`,
        },
        { "@type": "ListItem", position: 3, name: page.breadcrumb, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
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
        <ServicePageContent
          servicePage={page}
          cases={await getAllCases()}
          articles={await getPostsForService(page.key)}
        />
      </SiteShell>
    </>
  );
}
