import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogArticle } from "@/components/blog/blog-article";
import { SiteShell } from "@/components/layout/site-shell";
import { BRAND_NAME, type Locale } from "@/i18n/config";
import { blogPath, homePath, postPath } from "@/i18n/routes";
import { getAllPosts, otherPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Страница статьи. На вход — русский слуг: он идентификатор статьи в данных,
 * а у английской и испанской версий свои адреса. Маршрут приводит слуг из
 * адреса к русскому до вызова.
 */
export async function BlogPostPage({
  locale,
  ruSlug,
}: {
  locale: Locale;
  ruSlug: string;
}) {
  const posts = await getAllPosts(locale);
  const post = posts.find((item) => item.slug === ruSlug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${postPath(ruSlug, locale)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription,
      articleSection: post.category,
      image: `${siteUrl}${post.cover}`,
      url,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      inLanguage: locale,
      author: { "@type": "Organization", name: BRAND_NAME[locale], url: siteUrl },
      publisher: {
        "@type": "Organization",
        name: BRAND_NAME[locale],
        url: siteUrl,
        logo: { "@type": "ImageObject", url: `${siteUrl}/LOGO.svg` },
      },
      mainEntityOfPage: url,
    },
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
        {
          "@type": "ListItem",
          position: 2,
          name: t("breadcrumb"),
          item: `${siteUrl}${blogPath(locale)}`,
        },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell>
        <BlogArticle post={post} related={otherPosts(posts, post.slug)} />
      </SiteShell>
    </>
  );
}
