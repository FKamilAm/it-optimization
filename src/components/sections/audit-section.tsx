"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

const CARDS = [
  { key: "1", image: "/audit/card-1.webp" },
  { key: "2", image: "/audit/card-2.webp" },
  { key: "3", image: "/audit/card-3.webp" },
] as const;

function StackCard({
  index,
  total,
  progress,
  image,
  number,
  title,
  description,
  tags,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  image: string;
  number: string;
  title: string;
  description: string;
  tags: string;
}) {
  const isLast = index === total - 1;
  // Window of overall progress during which this card gets covered by the next.
  const start = index / total;
  const end = (index + 1) / total;
  // Gentle recede so the stack layering reads as a soft, smooth overlap.
  const scale = useTransform(progress, [start, end], [1, 0.95]);
  const opacity = useTransform(progress, [start, end], [1, 0.72]);

  // Each card sticks in the vertical centre of the viewport (not jammed at the top),
  // with a small per-card step so the underlying cards peek out of the stack.
  const cardRef = useRef<HTMLElement>(null);
  const [stickyTop, setStickyTop] = useState(140);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      const centered = Math.max(
        88,
        Math.round((window.innerHeight - el.offsetHeight) / 2),
      );
      setStickyTop(centered + index * 18);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [index]);

  return (
    <div className="sticky" style={{ top: stickyTop }}>
      <motion.article
        ref={cardRef}
        data-cursor="hover"
        style={isLast ? undefined : { scale, opacity }}
        className={cn(
          "group relative isolate origin-top overflow-hidden rounded-[28px] border border-white/14 bg-[#101010]",
          "hover:border-accent-border transition-colors duration-500",
        )}
      >
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* Thematic image (left on desktop, top on mobile). The source art is
              bright/glowing on a solid-black frame; mix-blend-screen drops that black
              into the card background so only the illustration shows (no dark box).
              object-contain keeps the whole illustration visible without cropping. */}
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-full md:min-h-[480px]">
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="scale-110 object-contain mix-blend-screen transition-transform duration-500 ease-out group-hover:scale-[1.16]"
            />
          </div>

          {/* Existing description text (right on desktop) */}
          <div className="relative flex flex-col gap-5 p-8 md:p-10 lg:p-14">
            <span className="text-accent text-sm font-medium tracking-[0.2em] uppercase md:text-base">
              {number}
            </span>
            <h3 className="text-2xl font-semibold tracking-[-0.025em] text-white md:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
              {title}
            </h3>
            <p className="body-large text-white/70">{description}</p>
            <p className="mt-1 text-sm tracking-normal text-white/50 md:text-base">
              {tags}
            </p>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export function AuditSection() {
  const t = useTranslations("audit");
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end start"],
  });

  return (
    <section id="audit" className="surface-dark section-padding relative">
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section max-w-4xl">{t("title")}</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="body-large mt-6 max-w-3xl text-white/60">{t("description")}</p>
        </Reveal>

        <div ref={stackRef} className="relative mt-16 flex flex-col gap-6 pb-[12vh]">
          {CARDS.map(({ key, image }, index) => (
            <StackCard
              key={key}
              index={index}
              total={CARDS.length}
              progress={scrollYProgress}
              image={image}
              number={String(index + 1).padStart(2, "0")}
              title={t(`cards.${key}.title`)}
              description={t(`cards.${key}.description`)}
              tags={t(`cards.${key}.tags`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
