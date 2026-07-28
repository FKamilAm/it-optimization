"use client";

import { type KeyboardEvent } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
import { formatTags, type CaseItem } from "@/lib/cases";

interface ProjectCardProps {
  /** The case to render — copy and artwork both come from content/cases.json. */
  item: CaseItem;
  index: number;
  onOpen: () => void;
}

export function ProjectCard({ item, index, onOpen }: ProjectCardProps) {
  const { title, description, quote, tags, cover } = item;

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
      className="group border-border/70 bg-background hover:border-accent/60 focus-visible:ring-accent/70 focus-visible:ring-offset-background relative flex h-full cursor-pointer flex-col rounded-[2rem] border p-4 transition-[border-color,box-shadow] duration-500 hover:shadow-[0_30px_75px_rgba(0,0,0,0.14)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:p-5 lg:p-6"
    >
      <div className="project-cover-square shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent transition-opacity duration-500 group-hover:from-black/45" />
        <span className="pointer-events-none absolute top-6 left-6 z-10 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-base tracking-[0.16em] text-white/85 backdrop-blur-sm">
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
        <blockquote className="border-accent/40 text-foreground/80 border-l-2 pl-4 text-base leading-relaxed italic">
          «{quote}»
        </blockquote>
        <p className="text-muted-foreground/80 mt-auto pt-2 text-base tracking-normal">
          {formatTags(tags)}
        </p>
      </div>
    </TiltCard>
  );
}
