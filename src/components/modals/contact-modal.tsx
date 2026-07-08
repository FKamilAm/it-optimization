"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { ContactChannels } from "@/components/contact/contact-channels";
import { ContactPerks } from "@/components/contact/contact-perks";

interface ContactModalProps {
  open: boolean;
  /** Service key (e.g. "platforms") to show its details, or null for a generic view. */
  service?: string | null;
  onClose: () => void;
}

export function ContactModal({ open, service, onClose }: ContactModalProps) {
  const t = useTranslations();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const base = service ? `services.items.${service}` : null;
  const title = base ? t(`${base}.title`) : t("contact.modal.title");
  const description = base ? t(`${base}.description`) : t("contact.modal.subtitle");
  const starterMessage = base
    ? t("contact.starter.service", { service: t(`${base}.title`) })
    : t("contact.starter.default");

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label={t("contact.modal.close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
            className="relative z-10 flex max-h-[92vh] w-full max-w-[1000px] flex-col overflow-y-auto overscroll-contain rounded-[2rem] bg-background shadow-[0_32px_80px_rgba(0,0,0,0.2)] lg:aspect-video lg:max-h-none lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:overflow-hidden"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label={t("contact.modal.close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left — service (or generic) info */}
            <div
              className={`flex flex-col gap-10 p-8 sm:p-10 ${
                base ? "justify-between" : "justify-center"
              }`}
            >
              <div className="flex flex-col gap-4 pr-10">
                <h2
                  id="contact-modal-title"
                  className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] md:text-4xl"
                >
                  {title}
                </h2>
                <p className="body-large max-w-lg text-muted-foreground">{description}</p>
              </div>

              {!base && <ContactPerks className="max-w-md" />}

              {base && (
                <dl className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("services.detail.budgetLabel")}
                    </dt>
                    <dd className="text-xl font-semibold text-foreground md:text-2xl">
                      {t(`${base}.budget`)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("services.detail.deadlineLabel")}
                    </dt>
                    <dd className="text-xl font-semibold text-foreground md:text-2xl">
                      {t(`${base}.deadline`)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Right — contact channels in a column */}
            <div className="flex flex-col justify-center bg-surface p-8 text-surface-foreground sm:p-10">
              <div className="mx-auto w-full max-w-[320px]">
                <ContactChannels
                  layout="column"
                  popoverPlacement="top"
                  message={starterMessage}
                  onNavigate={onClose}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
