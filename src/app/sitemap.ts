import type { MetadataRoute } from "next";
import { BLOG_POSTS, SERVICE_PAGES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const servicePages: MetadataRoute.Sitemap = Object.values(SERVICE_PAGES).map(
    (slug) => ({
      url: `${siteUrl}/uslugi/${slug}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const blogPosts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}/`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/proekty/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...servicePages,
    ...blogPosts,
  ];
}
