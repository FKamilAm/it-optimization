import { getTranslations } from "next-intl/server";
import { BRAND_NAME, LOCALE_OG, OG_IMAGE, type Locale } from "@/i18n/config";
import { ACCREDITATION, PROFILES, SITE, orgFor } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Разметка уровня организации. Рендерится из layout, то есть на каждой
 * странице — поэтому здесь только то, что верно для всего сайта.
 *
 * FAQPage отсюда убрана намеренно: она описывает восемь вопросов из блока на
 * главной, и вместе с layout уезжала на все 24 URL. На /proekty/ и в блоге это
 * разметка контента, которого на странице нет, а на страницах услуг она
 * сталкивалась со второй, настоящей FAQPage. Теперь блок вопросов объявляет
 * себя сам — там, где он действительно есть.
 *
 * Язык передаётся явно: без него getTranslations в корневом макете отдавал
 * русский каталог, и английская страница описывала себя по-русски, с
 * inLanguage "ru-RU". Название и адрес — по-английски на обеих языковых
 * версиях, как в подвале (ORG_INTL).
 */
export async function StructuredData({ locale }: { locale: Locale }) {
  const siteUrl = getSiteUrl();
  const meta = await getTranslations({ locale, namespace: "meta" });
  const name = BRAND_NAME[locale];
  const org = orgFor(locale);
  const accreditation = await getTranslations({ locale, namespace: "accreditation" });

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    legalName: org.legalName,
    url: siteUrl,
    logo: `${siteUrl}/LOGO.svg`,
    email: SITE.email,
    telephone: org.phone,
    address: {
      "@type": "PostalAddress",
      ...org.postal,
      postalCode: "628162",
      addressCountry: "RU",
    },
    sameAs: Object.values(PROFILES),
    // Госаккредитация Минцифры — с номером записи в реестре и ссылкой на
    // выписку, чтобы поисковик видел не голое заявление, а документ.
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: accreditation("badge"),
      credentialCategory: "accreditation",
      identifier: ACCREDITATION.registryNumber,
      dateCreated: ACCREDITATION.decisionDate,
      url: `${siteUrl}${ACCREDITATION.document}`,
      recognizedBy: {
        "@type": "GovernmentOrganization",
        name: ACCREDITATION.authority.name,
        url: ACCREDITATION.authority.url,
      },
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: siteUrl,
    description: meta("description"),
    inLanguage: LOCALE_OG[locale].replace("_", "-"),
  };

  const professionalService = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name,
    url: siteUrl,
    image: `${siteUrl}${OG_IMAGE[locale]}`,
    description: meta("description"),
    telephone: org.phone,
    email: SITE.email,
    address: organization.address,
    areaServed: {
      "@type": "Country",
      name: "Россия",
    },
    priceRange: "$$",
  };

  const payload = [organization, website, professionalService];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
