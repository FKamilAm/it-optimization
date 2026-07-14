"use client";

import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ContactModalProvider } from "@/components/providers/contact-modal-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { SkipLink } from "@/components/layout/skip-link";
import { SITE } from "@/lib/constants";

/**
 * Page frame shared by subpages (service pages): providers + header + footer +
 * floating contact. Header links point back to the homepage sections via the
 * "/" prefix. The homepage builds its own frame in page.tsx (it also has the
 * preloader), so it does not use this component.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const companyName = SITE.name;

  return (
    <SmoothScrollProvider>
      <ContactModalProvider>
        <SkipLink />
        <Header companyName={companyName} sectionPrefix="/" />
        <main id="main">{children}</main>
        <Footer companyName={companyName} />
        <FloatingContact />
      </ContactModalProvider>
    </SmoothScrollProvider>
  );
}
