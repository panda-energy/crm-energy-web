"use client";

import { Zap } from "lucide-react";
import Link from "next/link";
import { useLandingT } from "./i18n";

export function Footer() {
  const { t, dict } = useLandingT();

  const COLUMNS = [
    {
      title: t(dict.footer.columns.product),
      links: [
        { label: t(dict.modules.label), href: "#modulos" },
        { label: t(dict.integrations.label), href: "#integraciones" },
        { label: t(dict.security.label), href: "#seguridad" },
        { label: t(dict.pricing.label), href: "#precios" },
      ],
    },
    {
      title: t(dict.footer.columns.resources),
      links: [
        { label: "Docs", href: "#" },
        { label: "Blog", href: "#" },
        { label: "API", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: t(dict.footer.columns.legal),
      links: [
        { label: "Privacy", href: "#" },
        { label: "Cookies", href: "#" },
        { label: "DPA", href: "#" },
        { label: "Terms", href: "#" },
      ],
    },
    {
      title: t(dict.footer.columns.contact),
      links: [
        { label: "hola@kuro.energy", href: "mailto:hola@kuro.energy" },
        { label: "WhatsApp", href: "https://wa.me/34600000000" },
        { label: "LinkedIn", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-800/40 bg-[#09090B]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
                <Zap className="size-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Kuro</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              {t(dict.footer.tagline)}
            </p>
          </div>

          {COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-zinc-600 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/40 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-700">
            &copy; {new Date().getFullYear()} Kuro Energy. {t(dict.footer.rights)}
          </p>
          <p className="text-xs text-zinc-700">
            {t(dict.footer.madeWith)}
          </p>
        </div>
      </div>
    </footer>
  );
}
