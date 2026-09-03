import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { SITE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { formatPostDate } from "@/lib/blog/types";
import privacy from "../../../content/privacy.json";

// Текст политики лежит в content/privacy.json, а не в messages/ru.json, по той же
// причине, что и тексты страниц услуг: каталог целиком уезжает в каждую страницу
// экспорта, а этот документ нужен ровно одной. Страница — серверный компонент,
// поэтому JSON не попадает в клиентский бандл.
type Block = { type: "p"; text: string } | { type: "list"; items: string[] };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacyPage");
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/politika-konfidencialnosti/`;

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

export default async function PrivacyPage() {
  const t = await getTranslations("privacyPage");
  const sections = privacy.sections as { heading: string; blocks: Block[] }[];

  return (
    <SiteShell>
      <article className="surface-light relative overflow-hidden pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container-premium relative z-10">
          <nav aria-label="breadcrumb" className="mb-10">
            <ol className="text-foreground/50 flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  {t("breadcrumbHome")}
                </Link>
              </li>
              <ChevronRight className="text-foreground/30 h-4 w-4" aria-hidden="true" />
              <li aria-current="page" className="text-foreground/80">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>

          <div className="mx-auto max-w-4xl">
            <h1 className="heading-display">{t("title")}</h1>
            <p className="text-muted-foreground mt-6 text-sm">
              {t("updated")} {formatPostDate(privacy.updatedAt)}
            </p>
          </div>
        </div>
      </article>

      <div className="surface-light section-padding pt-8 md:pt-12">
        <div className="container-premium">
          <div className="mx-auto flex max-w-4xl flex-col gap-12">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="heading-section text-foreground">{section.heading}</h2>
                <div className="mt-6 flex flex-col gap-5">
                  {section.blocks.map((block, index) =>
                    block.type === "list" ? (
                      <ul key={index} className="flex flex-col gap-3">
                        {block.items.map((item) => (
                          <li
                            key={item}
                            className="text-muted-foreground relative pl-6 text-base leading-relaxed"
                          >
                            <span
                              className="bg-accent absolute top-[0.65em] left-0 h-1.5 w-1.5 rounded-full"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={index}
                        className="text-muted-foreground text-base leading-relaxed"
                      >
                        {block.text}
                      </p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
