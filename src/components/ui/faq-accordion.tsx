"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Аккордеон вопросов. Держит собственное состояние: открыт ровно один пункт,
 * повторный клик закрывает его.
 *
 * `surface` — на какой поверхности стоит блок, а не какого он цвета: "dark"
 * значит тёмная подложка и светлый текст. Совпадает с классами surface-dark /
 * surface-light у секции-обёртки, выбор остаётся за вызывающим кодом.
 *
 * Такой же аккордеон пока продолжает жить внутри service-page-content.tsx —
 * там он завязан на lightHero и общий стейт страницы, так что переезд сюда
 * стоит делать отдельно, а не попутно.
 */
export function FaqAccordion({
  items,
  surface = "light",
  defaultOpen = 0,
}: {
  items: FaqItem[];
  surface?: "light" | "dark";
  defaultOpen?: number;
}) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  const dark = surface === "dark";

  return (
    <div
      className={cn(
        "divide-y border-t",
        dark ? "divide-white/10 border-white/10" : "divide-border border-border",
      )}
    >
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className={cn(
              "py-1 transition-colors duration-300",
              isOpen && (dark ? "bg-accent-muted/30" : "bg-muted/40"),
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className={cn(
                "flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left transition-colors duration-300",
                isOpen && "border-accent border-l-2 pl-4",
              )}
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "heading-subsection max-w-3xl font-medium transition-colors duration-300",
                  dark
                    ? isOpen
                      ? "text-white"
                      : "text-white/80"
                    : isOpen
                      ? "text-foreground"
                      : "text-foreground/80",
                )}
              >
                {item.question}
              </span>
              <span
                className={cn(
                  "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  isOpen
                    ? dark
                      ? "border-accent/50 bg-accent/10 text-accent rotate-45"
                      : "border-accent/50 bg-accent/10 text-accent-foreground rotate-45"
                    : dark
                      ? "border-white/15 text-white/70"
                      : "border-border text-muted-foreground",
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <p
                  className={cn(
                    "body-base max-w-3xl pb-6 pl-4",
                    dark ? "text-white/65" : "text-muted-foreground",
                  )}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
