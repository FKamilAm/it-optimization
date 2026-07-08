"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/animations/reveal";
import { TECHNOLOGIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Per-word tilt so the tech names sit at varied angles (short names lean more,
// long ones less, so nothing collides). Indexed to match TECHNOLOGIES order.
const ANGLES = [
  20, -15, 12, -12, 18, -28, 10, -18, 22, -8, 10, -6, 30, -20, 16, 45, -35, 20, -8,
];

// Brand colour per technology (from → to). On hover the word is filled with the
// technology's own accent instead of the site accent. Multi-colour brands (e.g.
// Python = yellow/blue) use a gradient; single-colour ones repeat the same value.
const TECH_COLORS: Record<string, [string, string]> = {
  React: ["#61DAFB", "#61DAFB"],
  "Next.js": ["#f5f5f5", "#b8b8b8"],
  TypeScript: ["#3178C6", "#3178C6"],
  JavaScript: ["#F7DF1E", "#F7DF1E"],
  "Node.js": ["#8CC84B", "#3C873A"],
  Python: ["#FFD43B", "#4B8BBE"],
  PostgreSQL: ["#6B9BD1", "#336791"],
  MongoDB: ["#00ED64", "#00684A"],
  Supabase: ["#3ECF8E", "#249361"],
  "Telegram API": ["#37AEE2", "#1E96C8"],
  "OpenAI / AI": ["#9AC3B8", "#10A37F"],
  "Blockchain / Web3": ["#F7931A", "#627EEA"],
  Docker: ["#2496ED", "#2496ED"],
  "REST API": ["#38BDF8", "#0EA5E9"],
  GraphQL: ["#E535AB", "#E10098"],
  HTML5: ["#E34F26", "#E34F26"],
  CSS3: ["#1572B6", "#2965F1"],
  Tailwind: ["#38BDF8", "#06B6D4"],
  "Framer Motion": ["#FF5FA2", "#0055FF"],
};

function MarqueeRow({ duration }: { duration: string }) {
  // Two identical groups so translateX(-50%) loops seamlessly. Words use Unbounded
  // Black, are uppercased and each rotated to its own angle. Generous vertical
  // padding gives the tilted words room so they never clip against the row edges.
  return (
    <div className="marquee py-16 md:py-24">
      <div className="marquee-track" style={{ "--marquee-duration": duration } as CSSProperties}>
        {[0, 1].map((groupIndex) => (
          <div
            key={groupIndex}
            className="flex shrink-0 items-center"
            aria-hidden={groupIndex === 1}
          >
            {TECHNOLOGIES.map((tech, i) => {
              const [from, to] = TECH_COLORS[tech] ?? ["#ffffff", "#ffffff"];
              // Long, multi-part names (e.g. "Telegram API") sit a step smaller
              // so they don't dominate the marquee next to short logos.
              const sizeClass =
                tech.length >= 11
                  ? "text-2xl sm:text-3xl md:text-4xl"
                  : "text-3xl sm:text-4xl md:text-5xl";
              return (
                <span
                  key={`${groupIndex}-${tech}`}
                  data-cursor="hover"
                  style={
                    {
                      transform: `rotate(${ANGLES[i % ANGLES.length]}deg)`,
                      "--tech-from": from,
                      "--tech-to": to,
                    } as CSSProperties
                  }
                  className={cn(
                    "cursor-target mr-2.5 whitespace-nowrap font-display font-black uppercase leading-none tracking-normal text-white/35 transition-colors duration-300 hover:bg-gradient-to-br hover:from-[var(--tech-from)] hover:to-[var(--tech-to)] hover:bg-clip-text hover:text-transparent",
                    sizeClass,
                  )}
                >
                  {tech}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TechnologiesSection() {
  const t = useTranslations("technologies");

  return (
    <section id="technologies" className="surface-dark section-padding relative overflow-hidden">
      <div className="container-premium relative z-10">
        <Reveal>
          <h2 className="heading-section">{t("title")}</h2>
        </Reveal>
      </div>

      <div className="relative z-10 mt-8 md:mt-12">
        <MarqueeRow duration="55s" />
      </div>
    </section>
  );
}
