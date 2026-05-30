"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, Unplug, Smartphone, Sparkles } from "lucide-react";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

const ICONS = [FileSpreadsheet, Unplug, Smartphone, Sparkles];
const ACCENTS = [
  { accent: "from-red-500/20 to-orange-500/20", iconColor: "text-red-400" },
  { accent: "from-amber-500/20 to-yellow-500/20", iconColor: "text-amber-400" },
  { accent: "from-orange-500/20 to-red-500/20", iconColor: "text-orange-400" },
  { accent: "from-pink-500/20 to-red-500/20", iconColor: "text-pink-400" },
];

export function PainPoints() {
  const { ref, inView } = useInView();
  const { t, dict } = useLandingT();

  return (
    <section className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="max-w-2xl">
          <span className="text-sm font-medium tracking-wider text-zinc-500 uppercase">{t(dict.pain.label)}</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.pain.title)}{" "}
            <span className="text-zinc-500">{t(dict.pain.titleFaded)}</span>{" "}
            {t(dict.pain.titleEnd)}
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dict.pain.items.map((item, i) => {
            const Icon = ICONS[i]!;
            const { accent, iconColor } = ACCENTS[i]!;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }} className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700/60">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${accent} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="relative">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-zinc-800/80">
                    <Icon className={`size-5 ${iconColor}`} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{t(item.title)}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{t(item.desc)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
