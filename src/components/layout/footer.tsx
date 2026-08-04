"use client";

import { useTranslations } from "next-intl";
import { Mail, MapPin, Phone } from "lucide-react";
import { FooterWordmark } from "@/components/layout/footer-wordmark";
import { ORG, SITE } from "@/lib/constants";

interface FooterProps {
  companyName: string;
}

export function Footer({ companyName }: FooterProps) {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="surface-dark relative overflow-hidden border-t border-white/10 pt-24 md:pt-32">
      <div className="container-premium">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.legalName")}
                </dt>
                <dd className="text-base font-medium text-white/90">{ORG.legalName}</dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.inn")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {ORG.inn}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.kpp")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {ORG.kpp}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.ogrn")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {ORG.ogrn}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex max-w-sm flex-col gap-4 text-base text-white/70">
            <p className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 h-5 w-5 shrink-0 text-white/55"
                aria-hidden="true"
              />
              <span>{ORG.address}</span>
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="flex cursor-pointer items-center gap-3 transition-colors hover:text-white"
            >
              <Mail className="h-5 w-5 shrink-0 text-white/55" aria-hidden="true" />
              <span>{SITE.email}</span>
            </a>
            <a
              href={`tel:${ORG.phone.replace(/[^\d+]/g, "")}`}
              className="flex cursor-pointer items-center gap-3 transition-colors hover:text-white"
            >
              <Phone className="h-5 w-5 shrink-0 text-white/55" aria-hidden="true" />
              <span>{ORG.phone}</span>
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-base text-white/55">
          <p>
            © {year} {companyName}. {t("footer.rights")}
          </p>
        </div>
      </div>

      {/* Interactive wordmark: the striped art is rebuilt into independent
          horizontal segments that spring like plucked strings on hover. */}
      <div aria-hidden="true" className="mt-16 select-none sm:mt-20">
        <div className="container-premium">
          <FooterWordmark />
        </div>
      </div>
    </footer>
  );
}
