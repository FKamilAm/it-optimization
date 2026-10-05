import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { blogPath } from "@/i18n/routes";
import { BlogListPage } from "@/views/blog-list-page";
import { pageMetadata } from "@/views/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ locale: DEFAULT_LOCALE, namespace: "blog", path: blogPath });
}

export default function Page() {
  setRequestLocale(DEFAULT_LOCALE);
  return <BlogListPage locale={DEFAULT_LOCALE} />;
}
