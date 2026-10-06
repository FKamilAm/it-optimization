"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Mail, MapPin, Phone } from "lucide-react";
import { FooterWordmark } from "@/components/layout/footer-wordmark";
import { ACCREDITATION, SITE, orgFor } from "@/lib/constants";
import { formatPostDate } from "@/lib/blog/types";
import { usePaths } from "@/i18n/use-paths";

interface FooterProps {
  companyName: string;
}

export function Footer({ companyName }: FooterProps) {
  const t = useTranslations();
  const paths = usePaths();
  const org = orgFor(paths.locale);
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
                <dd className="text-base font-medium text-white/90">{org.legalName}</dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.inn")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {org.inn}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.kpp")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {org.kpp}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("footer.ogrn")}
                </dt>
                <dd className="font-mono text-base tracking-wide text-white/90">
                  {org.ogrn}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <dt className="text-xs tracking-[0.18em] text-white/60 uppercase">
                  {t("accreditation.label")}
                </dt>
                <dd className="flex flex-col gap-1.5 text-base text-white/90">
                  <span>
                    {t("accreditation.record", {
                      number: ACCREDITATION.registryNumber,
                      date: formatPostDate(ACCREDITATION.decisionDate, paths.locale),
                    })}
                  </span>
                  <a
                    href={ACCREDITATION.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("accreditation.document")}
                  </a>
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
              <span>{org.address}</span>
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="flex cursor-pointer items-center gap-3 transition-colors hover:text-white"
            >
              <Mail className="h-5 w-5 shrink-0 text-white/55" aria-hidden="true" />
              <span>{SITE.email}</span>
            </a>
            <a
              href={`tel:${org.phone.replace(/[^\d+]/g, "")}`}
              className="flex cursor-pointer items-center gap-3 transition-colors hover:text-white"
            >
              <Phone className="h-5 w-5 shrink-0 text-white/55" aria-hidden="true" />
              <span>{org.phone}</span>
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-base text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {companyName}. {t("footer.rights")}
          </p>
          {/* Публикация политики — требование ч. 2 ст. 18.1 152-ФЗ, поэтому
              ссылка стоит в подвале каждой страницы, а не только на главной. */}
          <Link
            href={paths.privacy}
            className="underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t("footer.privacy")}
          </Link>
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
