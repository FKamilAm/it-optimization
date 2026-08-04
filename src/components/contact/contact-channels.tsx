"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence } from "framer-motion";
import { Mail, Phone } from "lucide-react";
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

const CARD_CLASS =
  "group flex w-full items-center gap-4 rounded-2xl border border-border bg-background px-5 py-4 text-left transition-all duration-300 hover:border-accent hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]";

interface ContactChannelsProps {
  className?: string;
  /** "grid" = responsive two columns (default); "column" = single stacked column. */
  layout?: "grid" | "column";
  /** Where the copy popover opens relative to its button. */
  popoverPlacement?: "top" | "left";
  /** Pre-filled starter text for Telegram / WhatsApp chats. */
  message?: string;
  /** Called after a channel is chosen (e.g. to close a modal). */
  onNavigate?: () => void;
}

/**
 * Direct contact options. Messenger channels (Telegram / WhatsApp) open straight
 * away; phone / e-mail / MAX reveal a small popover with a "copy" button instead,
 * since those are more useful pasted than followed as a link.
 */
export function ContactChannels({
  className,
  layout = "grid",
  popoverPlacement = "top",
  message,
  onNavigate,
}: ContactChannelsProps) {
  const [openKey, setOpenKey] = useState<ContactChannelKey | null>(null);
  const { copied, copy } = useCopy();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openKey) return;

    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenKey(null);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openKey]);

  return (
    <div
      ref={rootRef}
      className={cn(
        layout === "column" ? "flex flex-col gap-3" : "grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {CONTACT_CHANNELS.map((channel) => {
        const Icon = ICONS[channel.key];
        const inner = (
          <>
            <span className="border-border bg-background text-foreground group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-foreground text-base font-medium">
                {channel.label}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                {channel.value}
              </span>
            </span>
          </>
        );

        if (channel.action === "copy") {
          const isOpen = openKey === channel.key;
          return (
            <div key={channel.key} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : channel.key)}
                aria-expanded={isOpen}
                data-cursor="hover"
                className={cn(CARD_CLASS, isOpen && "border-accent")}
              >
                {inner}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <CopyPopover
                    label={channel.label}
                    value={channel.value}
                    copied={copied}
                    onCopy={() => copy(channel.value)}
                    placement={popoverPlacement}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        }

        return (
          <a
            key={channel.key}
            href={withStarterMessage(channel.key, channel.href, message)}
            target={channel.external ? "_blank" : undefined}
            rel={channel.external ? "noopener noreferrer" : undefined}
            onClick={onNavigate}
            data-cursor="hover"
            className={CARD_CLASS}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
