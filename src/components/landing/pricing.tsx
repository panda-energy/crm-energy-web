"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

export function Pricing() {
  const { ref, inView } = useInView();
  const { t, locale, dict } = useLandingT();
  const plans = dict.pricing.plans;

  return (
    <section id="precios" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            {t(dict.pricing.label)}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.pricing.title)}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-500">
            {t(dict.pricing.sub)}
          </p>
        </motion.div>

        <div className="mt-16 grid items-start gap-4 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const isFeatured = i === 1;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                className={`relative rounded-2xl border p-7 ${
                  isFeatured
                    ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                    : "border-zinc-800/60 bg-zinc-900/20"
                }`}
              >
                {isFeatured && "badge" in plan && (
                  <>
                    <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-emerald-500/20 via-transparent to-cyan-500/10 blur-xl" />
                    <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                      {t(plan.badge)}
                    </span>
                  </>
                )}

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t(plan.desc)}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {plan.price === "Custom" ? (
                    <span className="text-3xl font-bold text-white">{t(dict.pricing.custom)}</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-sm text-zinc-500">{t(dict.pricing.perMonth)}</span>
                    </>
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features[locale].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`mt-0.5 size-4 shrink-0 ${isFeatured ? "text-emerald-400" : "text-zinc-600"}`} />
                      <span className="text-sm text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#demo"
                  className={`mt-8 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                    isFeatured
                      ? "bg-white text-zinc-900 hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                      : "border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {t(plan.cta)}
                  <ArrowRight className="size-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
