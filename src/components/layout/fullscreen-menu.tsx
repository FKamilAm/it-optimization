"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { NAV_ITEMS, SITE } from "@/lib/constants";

interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
}

export function FullscreenMenu({ open, onClose, companyName }: FullscreenMenuProps) {
  const t = useTranslations();
  const { scrollToSection } = useSmoothScroll();
  const { openContactModal } = useContactModal();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const navVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.15 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } },
  };

  const handleNavClick = (href: string) => {
    onClose();
    window.setTimeout(() => scrollToSection(href), 450);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-surface text-surface-foreground"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={t("a11y.mainNav")}
        >
          <div className="container-premium flex h-full flex-col">
            <div className="flex h-[72px] items-center md:h-20">
              <Logo companyName={companyName} className="brightness-0 invert" />
            </div>

            <div className="grid flex-1 gap-10 pb-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <motion.nav
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-2 md:gap-3"
              >
                {NAV_ITEMS.map((item) => (
                  <motion.a
                    key={item.key}
                    href={item.href}
                    variants={itemVariants}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="group inline-flex cursor-pointer items-center gap-4 text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] transition-colors duration-300 hover:text-accent"
                  >
                    <span className="text-base font-normal uppercase tracking-[0.2em] text-white/30 transition-colors group-hover:text-accent/60">
                      {String(NAV_ITEMS.indexOf(item) + 1).padStart(2, "0")}
                    </span>
                    {t(`nav.${item.key}`)}
                  </motion.a>
                ))}
              </motion.nav>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col gap-8 border-t border-white/10 pt-8 lg:border-t-0 lg:pt-0"
              >
                <div className="flex flex-col gap-3 text-base text-white/60">
                  <a
                    href={`mailto:${SITE.email}`}
                    className="inline-flex cursor-pointer items-center gap-2 transition-colors duration-300 hover:text-accent"
                  >
                    <Mail className="h-4 w-4" />
                    {SITE.email}
                  </a>
                  <a
                    href={SITE.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-2 transition-colors duration-300 hover:text-accent"
                  >
                    <Send className="h-4 w-4" />
                    Telegram
                  </a>
                </div>

                <Button
                  variant="inverse"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    onClose();
                    window.setTimeout(() => openContactModal(), 450);
                  }}
                >
                  {t("nav.cta")}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
