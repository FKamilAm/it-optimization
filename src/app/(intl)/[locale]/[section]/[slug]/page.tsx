import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import {
  postPath,
  postRuSlugBySlug,
  postSlug,
  sectionBySegment,
  segment,
  serviceKeyBySlug,
  servicePath,
  serviceSlug,
} from "@/i18n/routes";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { DRAFT_SERVICES, SERVICE_PAGES } from "@/lib/constants";
import { isPostTranslated, isServiceTranslated } from "@/lib/coverage";
import { BlogPostPage } from "@/views/blog-post-page";
import { contentMetadata } from "@/views/page-metadata";
import { requireServicePage, ServiceDetailPage } from "@/views/service-page";

/**
 * Страницы услуг и статей в языковых версиях.
 *
 * Один маршрут на оба раздела: адреса `/en/services/<slug>/` и
 * `/en/blog/<slug>/` отличаются только вторым сегментом, а он динамический —
 * см. соседний [section]/page.tsx. Разводятся они здесь, по таблице.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return PREFIXED_LOCALES.flatMap((locale) => [
    ...Object.keys(SERVICE_PAGES).map((key) => ({
      locale,
      section: segment("services", locale),
      slug: serviceSlug(key, locale),
    })),
    ...posts.map((post) => ({
      locale,
      section: segment("blog", locale),
      slug: postSlug(post.slug, locale),
    })),
  ]);
}

interface Props {
  params: Promise<{ locale: string; section: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolved = sectionBySegment(section, locale);

  if (resolved === "services") {
    const key = serviceKeyBySlug(slug, locale);
    if (!key) notFound();
    const page = await requireServicePage(key, locale);
    return contentMetadata({
      locale,
      title: page.metaTitle,
      description: page.metaDescription,
      path: (item) => servicePath(key, item),
      // Черновик — рано; непереведённая страница объявлена английской,
      // а внутри русская, и это тоже рано.
      noindex: DRAFT_SERVICES.has(key) || !isServiceTranslated(key, locale),
    });
  }

  if (resolved === "blog") {
    const ruSlug = postRuSlugBySlug(slug, locale);
    const post = ruSlug ? await getPostBySlug(ruSlug, locale) : undefined;
    if (!post || !ruSlug) notFound();
    return contentMetadata({
      locale,
      title: post.metaTitle,
      description: post.metaDescription,
      path: (item) => postPath(ruSlug, item),
      noindex: !isPostTranslated(ruSlug, locale),
    });
  }

  notFound();
}

export default async function Page({ params }: Props) {
  const { locale, section, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolved = sectionBySegment(section, locale);
  setRequestLocale(locale);
  const typed = locale as Locale;

  if (resolved === "services") {
    const key = serviceKeyBySlug(slug, locale);
    if (!key) notFound();
    return <ServiceDetailPage locale={typed} serviceKey={key} />;
  }

  if (resolved === "blog") {
    const ruSlug = postRuSlugBySlug(slug, locale);
    if (!ruSlug) notFound();
    return <BlogPostPage locale={typed} ruSlug={ruSlug} />;
  }

  notFound();
}
