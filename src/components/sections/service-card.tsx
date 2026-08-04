"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
import { SERVICE_PAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Homepage-style service card — shared by the homepage services grid, the
 * /uslugi/ catalog and the "смежные услуги" block on service pages so they all
 * read identically. `index` drives the alternating dark card (every 3rd, offset
 * by one).
 *
 * `headingAs` меняет только уровень заголовка, не вид: под секцией с h2
 * карточка должна быть h3, а на /uslugi/, где над сеткой стоит h1 страницы и
 * весь смысл документа — это и есть список услуг, их названия логичнее сделать
 * h2, не перепрыгивая уровень.
 */
export function ServiceCard({
  serviceKey,
  index,
  headingAs: Heading = "h3",
}: {
  serviceKey: string;
  index: number;
  headingAs?: "h2" | "h3";
}) {
  const t = useTranslations("services");
  const tags = t.raw(`items.${serviceKey}.tags`) as string[];
  const isDark = index % 3 === 1;
  const pageSlug = SERVICE_PAGES[serviceKey];

  const cardClassName = cn(
    "group relative flex h-full min-h-[280px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-8 duration-500 md:p-10",
    "transition-[border-color,box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    isDark
      ? "border-white/10 bg-surface text-surface-foreground hover:border-accent"
      : "border-border bg-background hover:border-accent hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)]",
  );

  return (
    <TiltCard
      as="a"
      href={`/uslugi/${pageSlug}/`}
      aria-label={t(`items.${serviceKey}.title`)}
      max={2.5}
      data-cursor="dark"
      className={cardClassName}
    >
      <span
        aria-hidden="true"
        className="bg-accent pointer-events-none absolute inset-x-0 bottom-0 z-0 h-full translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transition-none"
      />
      <div className="group-hover:text-accent-foreground relative z-10 transition-colors duration-500">
        <ArrowUpRight
          className={cn(
            "group-hover:text-accent-foreground h-5 w-5 transition-[transform,color] duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            isDark ? "text-white/50" : "text-muted-foreground",
          )}
        />
        <Heading className="heading-subsection mt-8 max-w-[16ch]">
          {t(`items.${serviceKey}.title`)}
        </Heading>
      </div>
      <ul className="relative z-10 mt-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className={cn(
              "group-hover:border-accent-foreground/25 group-hover:text-accent-foreground/80 rounded-full border px-3 py-1 text-base transition-colors duration-500",
              isDark
                ? "border-white/10 text-white/60"
                : "border-border text-muted-foreground",
            )}
          >
            {tag}
          </li>
        ))}
      </ul>
    </TiltCard>
  );
}
