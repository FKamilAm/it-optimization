import dynamic from "next/dynamic";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ContactModalProvider } from "@/components/providers/contact-modal-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { SkipLink } from "@/components/layout/skip-link";
import { SitePreloader } from "@/components/layout/site-preloader";
import { HeroSection } from "@/components/sections/hero-section";
import { SITE } from "@/lib/constants";

const AboutSection = dynamic(
  () => import("@/components/sections/about-section").then((m) => m.AboutSection),
);
const ServicesSection = dynamic(
  () => import("@/components/sections/services-section").then((m) => m.ServicesSection),
);
const IndustriesSection = dynamic(
  () => import("@/components/sections/industries-section").then((m) => m.IndustriesSection),
);
const SolutionsSection = dynamic(
  () => import("@/components/sections/solutions-section").then((m) => m.SolutionsSection),
);
const ProcessSection = dynamic(
  () => import("@/components/sections/process-section").then((m) => m.ProcessSection),
);
const AuditSection = dynamic(
  () => import("@/components/sections/audit-section").then((m) => m.AuditSection),
);
const FaqSection = dynamic(
  () => import("@/components/sections/faq-section").then((m) => m.FaqSection),
);
const TechnologiesSection = dynamic(
  () =>
    import("@/components/sections/technologies-section").then(
      (m) => m.TechnologiesSection,
    ),
);
const ContactSection = dynamic(
  () => import("@/components/sections/contact-section").then((m) => m.ContactSection),
);

export default function HomePage() {
  const companyName = SITE.name;

  return (
    <>
      <SitePreloader />
      <SmoothScrollProvider>
        <ContactModalProvider>
          <SkipLink />
          <Header companyName={companyName} />
          <main id="main">
            <HeroSection />
            <div className="section-defer">
              <ProcessSection />
            </div>
            <div className="section-defer">
              <ServicesSection />
            </div>
            <div className="section-defer">
              <IndustriesSection />
            </div>
            <div className="section-defer">
              <SolutionsSection />
            </div>
            <AuditSection />
            <div className="section-defer">
              <AboutSection />
            </div>
            <FaqSection />
            <div className="section-defer">
              <TechnologiesSection />
            </div>
            <div className="section-defer">
              <ContactSection />
            </div>
          </main>
          <Footer companyName={companyName} />
          <FloatingContact />
        </ContactModalProvider>
      </SmoothScrollProvider>
    </>
  );
}
