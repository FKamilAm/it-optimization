import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { BlogList } from "@/components/blog/blog-list";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: url },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      locale: "ru_RU",
      siteName: SITE.name,
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
  };
}

export default function BlogPage() {
  return (
    <SiteShell>
      <BlogList />
    </SiteShell>
  );
}
