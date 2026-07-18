import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { BlogArticle } from "@/components/blog/blog-article";
import { BLOG_POSTS, blogPostBySlug, SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) return {};

  const p = await getTranslations(`blog.posts.${post.key}`);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${slug}/`;

  return {
    title: p("metaTitle"),
    description: p("metaDescription"),
    alternates: { canonical: url },
    openGraph: {
      title: p("metaTitle"),
      description: p("metaDescription"),
      url,
      type: "article",
      locale: "ru_RU",
      siteName: SITE.name,
      images: [{ url: post.cover, width: 1200, height: 750 }],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();

  const p = await getTranslations(`blog.posts.${post.key}`);
  const t = await getTranslations("blog");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${slug}/`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p("title"),
      description: p("metaDescription"),
      articleSection: p("category"),
      image: `${siteUrl}${post.cover}`,
      url,
      author: { "@type": "Organization", name: SITE.name, url: siteUrl },
      publisher: { "@type": "Organization", name: SITE.name, url: siteUrl },
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
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("breadcrumb"),
          item: `${siteUrl}/blog/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: p("title"),
          item: url,
        },
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
        <BlogArticle postKey={post.key} />
      </SiteShell>
    </>
  );
}
