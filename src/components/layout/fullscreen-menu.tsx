"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useContactModal } from "@/components/providers/contact-modal-provider";
import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { SITE } from "@/lib/constants";

interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  /** "" on the homepage (smooth-scroll); "/" on subpages (navigate home + anchor). */
  sectionPrefix?: string;
}

export function FullscreenMenu({
  open,
  onClose,
  companyName,
  sectionPrefix = "",
}: FullscreenMenuProps) {
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

  // Section anchors + the dedicated Projects page (replaces industries/solutions).
  const menuItems = [
    { key: "home", href: `${sectionPrefix}#home`, page: false },
    { key: "process", href: `${sectionPrefix}#process`, page: false },
    { key: "services", href: `${sectionPrefix}#services`, page: false },
    { key: "projects", href: "/proekty/", page: true },
    { key: "blog", href: "/blog/", page: true },
    { key: "faq", href: `${sectionPrefix}#faq`, page: false },
    { key: "contact", href: `${sectionPrefix}#contact`, page: false },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bg-surface text-surface-foreground fixed inset-0 z-[100]"
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
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.key}
                    href={item.href}
                    variants={itemVariants}
                    onClick={(e) => {
                      if (item.page) {
                        onClose();
                        return;
                      }
                      if (sectionPrefix) {
                        onClose();
                        return;
                      }
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="group hover:text-accent inline-flex cursor-pointer items-center gap-4 text-[clamp(2rem,5vw,4.5rem)] leading-none font-semibold tracking-[-0.03em] transition-colors duration-300"
                  >
                    <span className="group-hover:text-accent/60 text-base font-normal tracking-[0.2em] text-white/30 uppercase transition-colors">
                      {String(index + 1).padStart(2, "0")}
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
                    className="hover:text-accent inline-flex cursor-pointer items-center gap-2 transition-colors duration-300"
                  >
                    <Mail className="h-4 w-4" />
                    {SITE.email}
                  </a>
                  <a
                    href={SITE.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent inline-flex cursor-pointer items-center gap-2 transition-colors duration-300"
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
