import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { BlogArticle } from "@/components/blog/blog-article";
import { getAllPosts, getPostBySlug, otherPosts } from "@/lib/blog";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${slug}/`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      locale: "ru_RU",
      siteName: SITE.name,
      images: [{ url: post.cover, width: 1200, height: 750 }],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const posts = await getAllPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${slug}/`;

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
      author: { "@type": "Organization", name: SITE.name, url: siteUrl },
      publisher: {
        "@type": "Organization",
        name: SITE.name,
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
          name: post.title,
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
        <BlogArticle post={post} related={otherPosts(posts, post.slug)} />
      </SiteShell>
    </>
  );
}
