"use client";

import type { ComponentType } from "react";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const PERKS: { key: string; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "reply", Icon: Clock },
  { key: "consult", Icon: Sparkles },
  { key: "approach", Icon: ShieldCheck },
];

/**
 * Short reassurance points (fast reply / free consult / clear process) used to
 * fill the left side of the contact section and the generic contact modal.
 */
export function ContactPerks({ className }: { className?: string }) {
  const t = useTranslations("contact.perks");

  return (
    <ul className={cn("flex flex-col gap-5", className)}>
      {PERKS.map(({ key, Icon }) => (
        <li key={key} className="flex items-start gap-4">
          <span className="border-border text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-foreground font-medium">{t(`${key}.title`)}</span>
            <span className="text-muted-foreground text-sm">{t(`${key}.text`)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
