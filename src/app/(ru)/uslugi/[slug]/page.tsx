import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { ServicePageContent } from "@/components/service-page/service-page-content";
import { getPostsForService } from "@/lib/blog";
import { getAllCases } from "@/lib/cases";
import { getServicePageBySlug, tariffPriceRange } from "@/lib/services";
import { DRAFT_SERVICES, SERVICE_PAGES, SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamicParams = false;

const ENTRIES = Object.entries(SERVICE_PAGES) as [string, string][];

export function generateStaticParams() {
  return ENTRIES.map(([, slug]) => ({ slug }));
}

/**
 * Тексты страницы лежат в `content/services.json`, а перечень адресов — в
 * `SERVICE_PAGES`: константа нужна и хедеру, и карте сайта, и клиентским
 * компонентам, которым нельзя тащить весь файл услуг. Расхождение двух списков
 * роняет сборку с внятным сообщением — молчаливая 404 нашлась бы куда позже.
 */
async function requireServicePage(slug: string) {
  const page = await getServicePageBySlug(slug);
  if (!page) {
    throw new Error(
      `Услуга «${slug}» есть в SERVICE_PAGES, но её нет в content/services.json`,
    );
  }
  return page;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await requireServicePage(slug);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/${slug}/`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    // Черновик собирается и открывается по прямой ссылке — так его можно
    // показать и вычитать, — но в поиск ему рано: ни ссылок с сайта, ни
    // карты сайта у него нет, и индексировать его тоже незачем.
    ...(DRAFT_SERVICES.has(page.key) ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
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
  const page = await requireServicePage(slug);
  const c = await getTranslations("servicePages.common");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/uslugi/${slug}/`;

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
      provider: {
        "@type": "Organization",
        name: SITE.name,
        url: siteUrl,
      },
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
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: c("breadcrumbServices"),
          item: `${siteUrl}/uslugi/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: page.breadcrumb,
          item: url,
        },
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
