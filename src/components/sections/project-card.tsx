"use client";

import { type KeyboardEvent } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

export type ProjectVisualVariant =
  | "crm"
  | "aiAgent"
  | "miniapp"
  | "web3"
  | "marketplace"
  | "corporate"
  | "svpr"
  | "tiger"
  | "mebel"
  | "renegade"
  | "visit"
  | "tgMiniApp"
  | "nori"
  | "street"
  | "crypto"
  | "score99";

// Full ordered list of case keys, shared by the homepage section (first few)
// and the dedicated /proekty page (all of them).
export const PROJECT_KEYS: ProjectVisualVariant[] = [
  "crm",
  "aiAgent",
  "miniapp",
  "marketplace",
  "web3",
  "corporate",
  "svpr",
  "tiger",
  "mebel",
  "renegade",
  "visit",
  "tgMiniApp",
  "nori",
  "street",
  "crypto",
  "score99",
];

interface ProjectCardProps {
  title: string;
  description: string;
  quote: string;
  tags: string;
  visual: ProjectVisualVariant;
  index: number;
  onOpen: () => void;
}

// Cover artwork per case (order matches the solutions section).
const COVER: Record<ProjectVisualVariant, string> = {
  crm: "/cases/case-crm.webp",
  aiAgent: "/cases/case-ai.webp",
  miniapp: "/cases/case-miniapp.webp",
  web3: "/cases/case-web3.webp",
  marketplace: "/cases/case-marketplace.webp",
  corporate: "/cases/case-corporate.webp",
  svpr: "/cases/case-svpr.webp",
  tiger: "/cases/case-tiger.webp",
  mebel: "/cases/case-mebel.webp",
  renegade: "/cases/case-renegade.webp",
  visit: "/cases/case-visit.webp",
  tgMiniApp: "/cases/case-tg-mini-app.webp",
  nori: "/cases/case-nori.webp",
  street: "/cases/case-street.webp",
  crypto: "/cases/case-crypto.webp",
  score99: "/cases/case-99.webp",
};

// Full presentation slide shown in the lightbox when a case is opened (desktop, 16:9).
export const CASE_DETAIL: Record<ProjectVisualVariant, string> = {
  crm: "/cases/detail-crm.webp",
  aiAgent: "/cases/detail-ai.webp",
  miniapp: "/cases/detail-miniapp.webp",
  web3: "/cases/detail-web3.webp",
  marketplace: "/cases/detail-marketplace.webp",
  corporate: "/cases/detail-corporate.webp",
  svpr: "/cases/detail-svpr.webp",
  tiger: "/cases/detail-tiger.webp",
  mebel: "/cases/detail-mebel.webp",
  renegade: "/cases/detail-renegade.webp",
  visit: "/cases/detail-visit.webp",
  tgMiniApp: "/cases/detail-tg-mini-app.webp",
  nori: "/cases/detail-nori.webp",
  street: "/cases/detail-street.webp",
  crypto: "/cases/detail-crypto.webp",
  score99: "/cases/detail-99.webp",
};

// Portrait (9:16) variant used in the lightbox on mobile so the whole slide fits
// the screen without scrolling.
export const CASE_DETAIL_MOBILE: Record<ProjectVisualVariant, string> = {
  crm: "/cases/detail-crm-mobile.webp",
  aiAgent: "/cases/detail-ai-mobile.webp",
  miniapp: "/cases/detail-miniapp-mobile.webp",
  web3: "/cases/detail-web3-mobile.webp",
  marketplace: "/cases/detail-marketplace-mobile.webp",
  corporate: "/cases/detail-corporate-mobile.webp",
  svpr: "/cases/detail-svpr-mobile.webp",
  tiger: "/cases/detail-tiger-mobile.webp",
  mebel: "/cases/detail-mebel-mobile.webp",
  renegade: "/cases/detail-renegade-mobile.webp",
  visit: "/cases/detail-visit-mobile.webp",
  tgMiniApp: "/cases/detail-tg-mini-app-mobile.webp",
  nori: "/cases/detail-nori-mobile.webp",
  street: "/cases/detail-street-mobile.webp",
  crypto: "/cases/detail-crypto-mobile.webp",
  score99: "/cases/detail-99-mobile.webp",
};

export function ProjectCard({
  title,
  description,
  quote,
  tags,
  visual,
  index,
  onOpen,
}: ProjectCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <TiltCard
      as="article"
      max={2.5}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Открыть кейс: ${title}`}
      data-cursor="hover"
      className="group relative flex h-full cursor-pointer flex-col rounded-[2rem] border border-border/70 bg-background p-4 duration-500 transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-[0_30px_75px_rgba(0,0,0,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-5 lg:p-6"
    >
      <div className="project-cover-square shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        <Image
          src={COVER[visual]}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent transition-opacity duration-500 group-hover:from-black/45" />
        <span className="pointer-events-none absolute left-6 top-6 z-10 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-base tracking-[0.16em] text-white/85 backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </span>
        {/* Visual hint only — the whole card is the click target (see TiltCard props). */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center pb-6">
          <span className="inline-flex translate-y-2 items-center gap-2 rounded-full border border-white/25 bg-black/55 px-4 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Maximize2 className="h-4 w-4" />
            Открыть
          </span>
        </span>
      </div>

      <div className="mt-7 flex flex-1 flex-col gap-5 md:mt-8">
        <h3 className="heading-subsection">{title}</h3>
        <p className="body-base text-muted-foreground">{description}</p>
        <blockquote className="border-l-2 border-accent/40 pl-4 text-base italic leading-relaxed text-foreground/80">
          «{quote}»
        </blockquote>
        <p className="mt-auto pt-2 text-base tracking-normal text-muted-foreground/80">
          {tags}
        </p>
      </div>
    </TiltCard>
  );
}
