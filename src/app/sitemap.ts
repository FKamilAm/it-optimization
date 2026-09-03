import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAllCases } from "@/lib/cases";
import { SERVICE_NAV } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import privacy from "../../content/privacy.json";

export const dynamic = "force-static";

/**
 * `lastmod` проставляется только там, где под ним есть настоящая дата: кейсы
 * приносят свой updatedAt из панели, статьи — свой из content/blog.json. Раньше
 * во все 24 URL подставлялось время сборки — то есть каждый деплой объявлял
 * все страницы сразу обновлёнными. Поисковики такой lastmod распознают и
 * перестают ему верить по всему сайту, поэтому у страниц без даты (главная,
 * хаб услуг, страницы услуг) поле просто отсутствует: по протоколу оно
 * необязательное, и его отсутствие честнее выдуманного значения.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [cases, posts] = await Promise.all([getAllCases(), getAllPosts()]);

  const latest = (dates: string[]): Date | undefined => {
    const times = dates.map((value) => new Date(value).getTime()).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : undefined;
  };

  const casesUpdated = latest(cases.map((item) => item.updatedAt));
  const blogUpdated = latest(posts.map((post) => post.updatedAt));

  // SERVICE_NAV, а не SERVICE_PAGES: в перечне адресов лежат и черновики,
  // которым в карте сайта делать нечего.
  const servicePages: MetadataRoute.Sitemap = SERVICE_NAV.map(({ slug }) => ({
    url: `${siteUrl}/uslugi/${slug}/`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
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
    // Политика — не маркетинговая страница, но она должна быть индексируемой:
    // публикация подтверждается тем, что документ доступен и находится поиском.
    // lastModified настоящий — из даты редакции в content/privacy.json.
    {
      url: `${siteUrl}/politika-konfidencialnosti/`,
      lastModified: new Date(privacy.updatedAt),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
