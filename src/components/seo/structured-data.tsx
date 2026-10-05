import { getTranslations } from "next-intl/server";
import { BRAND_NAME, LOCALE_OG, OG_IMAGE, type Locale } from "@/i18n/config";
import { ORG, PROFILES, SITE } from "@/lib/constants";
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
 * inLanguage "ru-RU". Адрес и юридическое название не переводятся — это
 * реквизиты, а не текст.
 */
export async function StructuredData({ locale }: { locale: Locale }) {
  const siteUrl = getSiteUrl();
  const meta = await getTranslations({ locale, namespace: "meta" });
  const name = BRAND_NAME[locale];

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
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
    sameAs: Object.values(PROFILES),
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
    telephone: ORG.phone,
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
