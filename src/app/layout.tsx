import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CursorFollower } from "@/components/layout/cursor-follower";
import { StructuredData } from "@/components/seo/structured-data";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["900"],
  variable: "--font-unbounded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = getSiteUrl();
  const keywords = t("keywords")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: `%s — ${SITE.name}`,
    },
    description: t("description"),
    keywords,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: "ru_RU",
      type: "website",
      url: siteUrl,
      siteName: SITE.name,
      images: [
        {
          url: "/og-image.webp",
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.webp"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
    icons: {
      icon: [
        {
          url: "/favicon_black.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon_white.svg",
          type: "image/svg+xml",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      shortcut: "/favicon_black.svg",
      apple: "/favicon_black.svg",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${unbounded.variable} font-sans antialiased`}>
        <StructuredData />
        <NextIntlClientProvider locale="ru" messages={messages}>
          <CursorFollower />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
