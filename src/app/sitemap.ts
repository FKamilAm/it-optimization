import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@/i18n/config";
import {
  blogPath,
  homePath,
  postPath,
  privacyPath,
  projectsPath,
  servicePath,
  servicesPath,
} from "@/i18n/routes";
import { getAllPosts } from "@/lib/blog";
import { getAllCases } from "@/lib/cases";
import { SERVICE_NAV } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import privacy from "../../content/privacy.json";

export const dynamic = "force-static";

/**
 * Карта сайта на три языка.
 *
 * Каждая страница попадает в карту трижды — по разу на локаль, — и каждая
 * запись несёт `alternates.languages` со всеми тремя адресами. Это тот же
 * hreflang, что в <head>, но продублированный в карте: поисковики читают оба
 * источника, а карта вдобавок рассказывает про страницы, на которые с других
 * страниц ссылок мало.
 *
 * `lastmod` проставляется только там, где под ним есть настоящая дата: кейсы
 * приносят свой updatedAt из панели, статьи — свой из content/blog.json.
 * Раньше во все URL подставлялось время сборки, то есть каждый деплой
 * объявлял весь сайт обновлённым; поисковики такой lastmod распознают и
 * перестают ему верить. У страниц без даты поле просто отсутствует — по
 * протоколу оно необязательное, и его отсутствие честнее выдуманного.
 */

/** Одна страница → три записи, у каждой полный список переводов. */
function entry(
  build: (locale: Locale) => string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {},
): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${siteUrl}${build(locale)}`]),
  );

  return LOCALES.map((locale) => ({
    url: `${siteUrl}${build(locale)}`,
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cases, posts] = await Promise.all([getAllCases(), getAllPosts()]);

  const latest = (dates: string[]): Date | undefined => {
    const times = dates.map((value) => new Date(value).getTime()).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : undefined;
  };

  const casesUpdated = latest(cases.map((item) => item.updatedAt));
  const blogUpdated = latest(posts.map((post) => post.updatedAt));

  return [
    ...entry(homePath, { changeFrequency: "monthly", priority: 1 }),
    ...entry(servicesPath, { changeFrequency: "monthly", priority: 0.9 }),
    ...entry(projectsPath, {
      lastModified: casesUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...entry(blogPath, {
      lastModified: blogUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
    // SERVICE_NAV, а не все ключи: в перечне адресов лежат и черновики,
    // которым в карте сайта делать нечего.
    ...SERVICE_NAV.flatMap(({ key }) =>
      entry((locale) => servicePath(key, locale), {
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    ),
    ...posts.flatMap((post) =>
      entry((locale) => postPath(post.slug, locale), {
        lastModified: new Date(post.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    // Политика — не маркетинговая страница, но индексируемая: публикация
    // подтверждается тем, что документ доступен и находится поиском.
    ...entry(privacyPath, {
      lastModified: new Date(privacy.updatedAt),
      changeFrequency: "yearly",
      priority: 0.3,
    }),
  ];
}
