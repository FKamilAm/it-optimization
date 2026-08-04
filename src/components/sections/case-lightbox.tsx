"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface CaseLightboxProps {
  /** Image source (desktop, 16:9), or null when closed. */
  src: string | null;
  /** Portrait (9:16) source shown on mobile. Falls back to `src` if absent. */
  srcMobile?: string | null;
  alt: string;
  onClose: () => void;
}

export function CaseLightbox({ src, srcMobile, alt, onClose }: CaseLightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Portal to <body> so the overlay escapes the section's `content-visibility`
  // containment (otherwise `position: fixed` is trapped inside the section and
  // the image overflows / needs scrolling).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // On phones we show a dedicated 9:16 slide sized to the viewport height.
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const useMobile = isMobile && Boolean(srcMobile);
  const activeSrc = useMobile ? srcMobile : src;

  useEffect(() => {
    if (!src) return;

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
  }, [src, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {src && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-8"
        >
          {/* Darkened, blurred backdrop — click anywhere to dismiss. */}
          <motion.button
            type="button"
            aria-label="Закрыть"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Persistent close button, always at the screen corner. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-4 right-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-6 sm:right-6 sm:h-12 sm:w-12"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* The frame's width is derived so it always fits inside the viewport on
              BOTH axes — the whole slide is visible with no scrolling. Desktop uses
              a 16:9 slide (1.3× smaller than full-fit); mobile uses a 9:16 slide
              sized to the (dynamic) viewport height. */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
            style={{
              width: useMobile
                ? "min(94vw, calc((100dvh - 3.5rem) * 9 / 16))"
                : "calc(min(94vw, 1600px, calc((100vh - 5rem) * 16 / 9)) / 1.3)",
            }}
            className={`relative z-10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_40px_120px_rgba(0,0,0,0.65)] focus:outline-none ${
              useMobile ? "aspect-[9/16]" : "aspect-video"
            }`}
          >
            {activeSrc && (
              <Image
                src={activeSrc}
                alt={alt}
                fill
                sizes="94vw"
                className="object-contain"
                priority
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
