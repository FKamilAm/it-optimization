"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Placement = "top" | "left";

interface CopyPopoverProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  placement?: Placement;
  className?: string;
}

const PLACEMENT: Record<Placement, string> = {
  top: "bottom-full left-0 mb-3 origin-bottom-left",
  left: "right-full top-1/2 mr-3 -translate-y-1/2 origin-right",
};

/**
 * Small popover that reveals a contact value and lets the user copy it.
 * Used for channels that have no reliable deep link (phone / e-mail / MAX).
 */
export function CopyPopover({
  label,
  value,
  copied,
  onCopy,
  placement = "top",
  className,
}: CopyPopoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: placement === "top" ? 6 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: placement === "top" ? 6 : 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "border-border bg-background absolute z-50 w-64 rounded-2xl border p-4 text-left shadow-[0_24px_60px_rgba(0,0,0,0.18)]",
        PLACEMENT[placement],
        className,
      )}
    >
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-lg font-semibold break-all select-all">
        {value}
      </p>
      <Button
        variant="primary"
        size="sm"
        showArrow={false}
        type="button"
        onClick={onCopy}
        className="mt-3 w-full"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Скопировано" : "Скопировать данные"}
      </Button>
    </motion.div>
  );
}
