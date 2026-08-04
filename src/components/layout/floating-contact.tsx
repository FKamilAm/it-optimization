"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Headphones, Mail, Phone, X } from "lucide-react";
import { MaxIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons/brand-icons";
import { CopyPopover } from "@/components/contact/copy-popover";
import {
  CONTACT_CHANNELS,
  withStarterMessage,
  type ContactChannelKey,
} from "@/lib/constants";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

const ICONS: Record<ContactChannelKey, ComponentType<{ className?: string }>> = {
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
  max: MaxIcon,
  phone: Phone,
  email: Mail,
};

const BUBBLE_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-all duration-300 hover:border-accent hover:bg-accent hover:text-accent-foreground";

export function FloatingContact() {
  const t = useTranslations();
  const starter = t("contact.starter.default");
  const [open, setOpen] = useState(false);
  const [copyKey, setCopyKey] = useState<ContactChannelKey | null>(null);
  const { copied, copy } = useCopy();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setCopyKey(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCopyKey(null);
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] md:right-8 md:bottom-8"
    >
      <AnimatePresence onExitComplete={() => setCopyKey(null)}>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-end gap-3"
            role="menu"
            aria-label={t("floating.open")}
          >
            {CONTACT_CHANNELS.map((channel, index) => {
              const Icon = ICONS[channel.key];
              const entrance = {
                initial: { opacity: 0, y: 16, scale: 0.9 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: 8, scale: 0.95 },
                transition: { delay: index * 0.05, duration: 0.3 },
              };

              if (channel.action === "copy") {
                const isOpen = copyKey === channel.key;
                return (
                  <motion.div key={channel.key} {...entrance} className="relative">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setCopyKey(isOpen ? null : channel.key)}
                      aria-expanded={isOpen}
                      aria-label={channel.label}
                      data-cursor="dark"
                      className={cn(
                        BUBBLE_CLASS,
                        isOpen && "border-accent bg-accent text-accent-foreground",
                      )}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <CopyPopover
                          label={channel.label}
                          value={channel.value}
                          copied={copied}
                          onCopy={() => copy(channel.value)}
                          placement="left"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }

              return (
                <motion.a
                  key={channel.key}
                  href={withStarterMessage(channel.key, channel.href, starter)}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noopener noreferrer" : undefined}
                  role="menuitem"
                  {...entrance}
                  onClick={() => setOpen(false)}
                  data-cursor="dark"
                  className={BUBBLE_CLASS}
                  aria-label={channel.label}
                >
                  <Icon className="h-[22px] w-[22px]" />
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          setCopyKey(null);
          setOpen((v) => !v);
        }}
        data-cursor="dark"
        className={cn(
          "bg-foreground text-background hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-accent flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/80 shadow-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
          open && "border-accent bg-accent text-accent-foreground",
        )}
        aria-label={open ? t("floating.close") : t("floating.open")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
      </button>
    </div>
  );
}
