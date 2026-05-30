"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, MapPin, Lock, KeyRound,
  PenTool, Shield, Database, Brain,
} from "lucide-react";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

const ICONS = [ShieldCheck, MapPin, Lock, KeyRound, PenTool, Shield, Database, Brain];

export function Security() {
  const { ref, inView } = useInView();
  const { t, dict } = useLandingT();

  return (
    <section id="seguridad" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            {t(dict.security.label)}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.security.title)}{" "}
            <span className="text-zinc-500">{t(dict.security.titleFaded)}</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dict.security.badges.map((badge, i) => {
            const Icon = ICONS[i]!;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-4 transition-colors hover:border-emerald-500/20"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Icon className="size-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t(badge.label)}</h3>
                  <p className="mt-0.5 text-xs text-zinc-600">{t(badge.desc)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
