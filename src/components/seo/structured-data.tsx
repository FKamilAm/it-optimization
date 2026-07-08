import { getTranslations } from "next-intl/server";
import { ORG, SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export async function StructuredData() {
  const siteUrl = getSiteUrl();
  const meta = await getTranslations("meta");
  const faq = await getTranslations("faq.items");

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: ORG.legalName,
    url: siteUrl,
    logo: `${siteUrl}/LOGO.svg`,
    email: SITE.email,
    telephone: ORG.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Молодости, д. 1, кв. 68",
      addressLocality: "Белоярский",
      addressRegion: "Ханты-Мансийский автономный округ — Югра",
      postalCode: "628162",
      addressCountry: "RU",
    },
    sameAs: [SITE.telegram],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: siteUrl,
    description: meta("description"),
    inLanguage: "ru-RU",
  };

  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.name,
    url: siteUrl,
    image: `${siteUrl}/og-image.webp`,
    description: meta("description"),
    telephone: ORG.phone,
    email: SITE.email,
    address: organization.address,
    areaServed: {
      "@type": "Country",
      name: "Россия",
    },
    priceRange: "$$",
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: faq(`${key}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq(`${key}.answer`),
      },
    })),
  };

  const payload = [organization, website, professionalService, faqPage];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
