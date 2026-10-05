import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { postPath } from "@/i18n/routes";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { BlogPostPage } from "@/views/blog-post-page";
import { contentMetadata } from "@/views/page-metadata";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return contentMetadata({
    locale: DEFAULT_LOCALE,
    title: post.metaTitle,
    description: post.metaDescription,
    path: (locale) => postPath(slug, locale),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  setRequestLocale(DEFAULT_LOCALE);
  return <BlogPostPage locale={DEFAULT_LOCALE} ruSlug={slug} />;
}
