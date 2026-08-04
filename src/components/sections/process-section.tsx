"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

type StepStatus = "pending" | "active" | "completed";

export function ProcessSection() {
  const t = useTranslations("process");
  const stepsRef = useRef<(HTMLElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const lineProgress = STEP_KEYS.length > 1 ? activeStep / (STEP_KEYS.length - 1) : 0;

  useEffect(() => {
    const steps = stepsRef.current.filter(Boolean) as HTMLElement[];
    if (!steps.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = steps.findIndex((el) => el === entry.target);
            if (index >= 0) setActiveStep(index);
          }
        });
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" className="surface-dark section-padding relative">
      <div className="container-premium relative z-10">
        <div className="grid items-start gap-16 lg:grid-cols-[38%_62%] lg:gap-24">
          <aside className="lg:sticky lg:top-[120px] lg:h-fit lg:self-start">
            <h2 className="heading-section max-w-md">{t("title")}</h2>
            <p className="body-base mt-5 max-w-md text-white/60">{t("description")}</p>

            <div className="mt-10 hidden items-center gap-4 lg:flex">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-accent h-full origin-left rounded-full transition-transform duration-500 ease-out"
                  style={{ transform: `scaleX(${Math.max(lineProgress, 0.06)})` }}
                />
              </div>
              <span className="text-sm font-medium text-white/45 tabular-nums">
                {String(activeStep + 1).padStart(2, "0")} /{" "}
                {String(STEP_KEYS.length).padStart(2, "0")}
              </span>
            </div>
          </aside>

          <div className="process-steps relative space-y-0">
            <div className="absolute top-4 bottom-4 left-[19px] hidden w-px bg-white/10 md:block" />
            <div
              className="bg-accent absolute top-4 left-[19px] hidden h-[calc(100%-2rem)] w-px origin-top transition-transform duration-500 ease-out md:block"
              style={{ transform: `scaleY(${lineProgress})` }}
            />

            {STEP_KEYS.map((key, index) => {
              const status: StepStatus =
                index < activeStep
                  ? "completed"
                  : index === activeStep
                    ? "active"
                    : "pending";

              return (
                <article
                  key={key}
                  ref={(el) => {
                    stepsRef.current[index] = el;
                  }}
                  data-status={status}
                  className={cn(
                    "process-step relative grid gap-4 border-t border-white/10 py-8 md:grid-cols-[48px_1fr] md:gap-6",
                    status === "active" && "is-active",
                    status === "completed" && "is-completed",
                  )}
                >
                  <div
                    className={cn(
                      "process-step-number relative flex h-10 w-10 items-center justify-center rounded-full border text-base font-medium transition-all duration-500",
                      status === "active" &&
                        "border-accent bg-accent text-accent-foreground shadow-[0_0_26px_rgba(180,224,45,0.4)]",
                      status === "completed" &&
                        "border-accent/40 bg-accent/10 text-accent",
                      status === "pending" &&
                        "border-white/15 bg-white/[0.03] text-white/60",
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      key
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3
                        className={cn(
                          "heading-subsection transition-colors duration-500",
                          status === "pending" ? "text-white/80" : "text-white",
                        )}
                      >
                        {t(`steps.${key}.title`)}
                      </h3>

                      {status === "active" && (
                        <span className="border-accent/30 bg-accent/10 text-accent inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.12em] uppercase">
                          <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
                          {t("statusActive")}
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "body-base mt-2 transition-colors duration-500",
                        status === "active" ? "text-white/75" : "text-white/70",
                      )}
                    >
                      {t(`steps.${key}.description`)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
