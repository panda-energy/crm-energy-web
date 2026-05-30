"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import Link from "next/link";
import { useLandingT } from "./i18n";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, dict } = useLandingT();

  const NAV_LINKS = [
    { href: "#modulos", label: t(dict.nav.product) },
    { href: "#ia", label: t(dict.nav.ai) },
    { href: "#integraciones", label: t(dict.nav.integrations) },
    { href: "#seguridad", label: t(dict.nav.security) },
    { href: "#precios", label: t(dict.nav.pricing) },
    { href: "#faq", label: t(dict.nav.faq) },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-2xl"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-emerald-500 transition-transform duration-300 group-hover:scale-110">
              <Zap className="size-4 text-white" />
              <div className="absolute inset-0 rounded-lg bg-emerald-400/50 blur-lg opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Kuro</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="relative rounded-lg px-3.5 py-2 text-sm text-zinc-400 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/sign-in" className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white">
              {t(dict.nav.signIn)}
            </Link>
            <a href="#demo" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-400">
              <span className="relative z-10">{t(dict.nav.requestDemo)}</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
          </div>

          <button onClick={() => setMobileOpen(true)} className="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white md:hidden" aria-label="Menu">
            <Menu className="size-5" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[60] bg-[#09090B]/95 backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500"><Zap className="size-4 text-white" /></div>
                <span className="text-lg font-semibold text-white">Kuro</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="flex size-10 items-center justify-center rounded-lg text-zinc-400" aria-label="Close"><X className="size-5" /></button>
            </div>
            <nav className="flex flex-col gap-1 px-6 pt-8">
              {NAV_LINKS.map(({ href, label }, i) => (
                <motion.a key={href} href={href} onClick={() => setMobileOpen(false)} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }} className="rounded-lg px-4 py-3 text-2xl font-medium text-zinc-300 transition-colors hover:text-white">
                  {label}
                </motion.a>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-8 flex flex-col gap-3">
                <Link href="/sign-in" className="rounded-xl border border-zinc-800 px-6 py-3 text-center text-sm font-medium text-white">{t(dict.nav.signIn)}</Link>
                <a href="#demo" onClick={() => setMobileOpen(false)} className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-medium text-white">{t(dict.nav.requestDemo)}</a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
