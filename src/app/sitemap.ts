import type { MetadataRoute } from "next";
import { getAllCases } from "@/lib/cases";
import { BLOG_POSTS, SERVICE_PAGES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

/**
 * `lastmod` проставляется только там, где под ним есть настоящая дата: кейсы
 * приносят свой updatedAt из панели, у статей дата лежит в BLOG_POSTS. Раньше
 * во все 24 URL подставлялось время сборки — то есть каждый деплой объявлял
 * все страницы сразу обновлёнными. Поисковики такой lastmod распознают и
 * перестают ему верить по всему сайту, поэтому у страниц без даты (главная,
 * хаб услуг, страницы услуг) поле просто отсутствует: по протоколу оно
 * необязательное, и его отсутствие честнее выдуманного значения.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const cases = await getAllCases();

  const latest = (dates: string[]): Date | undefined => {
    const times = dates.map((value) => new Date(value).getTime()).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : undefined;
  };

  const casesUpdated = latest(cases.map((item) => item.updatedAt));
  const blogUpdated = latest(BLOG_POSTS.map((post) => post.updatedAt));

  const servicePages: MetadataRoute.Sitemap = Object.values(SERVICE_PAGES).map(
    (slug) => ({
      url: `${siteUrl}/uslugi/${slug}/`,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const blogPosts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}/`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/uslugi/`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/proekty/`,
      lastModified: casesUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog/`,
      lastModified: blogUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...servicePages,
    ...blogPosts,
  ];
}
