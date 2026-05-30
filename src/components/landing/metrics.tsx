"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

const STAT_VALUES = [
  { end: 5, suffix: "", prefix: "" },
  { end: 3, suffix: "", prefix: "" },
  { end: 604, suffix: "", prefix: "" },
  { end: 10, suffix: "", prefix: "" },
  { end: 1, suffix: "s", prefix: "<" },
  { end: 99.5, suffix: "%", prefix: "" },
] as const;

function Counter({ end, suffix = "", prefix = "", inView }: {
  end: number; suffix?: string; prefix?: string; inView: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setValue(end);
        clearInterval(timer);
      } else {
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Number((eased * end).toFixed(end % 1 ? 1 : 0)));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end, inView]);

  const display = end % 1 ? value.toFixed(1) : Math.round(value);

  return (
    <span className="tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}

export function Metrics() {
  const { ref, inView } = useInView(0.3);
  const { t, dict } = useLandingT();

  return (
    <section className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.metrics.title)}
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dict.metrics.items.map((item, i) => {
            const sv = STAT_VALUES[i]!;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className="relative rounded-2xl border border-zinc-800/40 bg-zinc-900/20 p-6 text-center"
              >
                <div className="text-4xl font-bold text-white md:text-5xl">
                  <Counter end={sv.end} suffix={sv.suffix} prefix={sv.prefix} inView={inView} />
                </div>
                <div className="mt-2 text-sm font-medium text-zinc-400">{t(item.label)}</div>
                <div className="mt-1 text-xs text-zinc-600">{t(item.detail)}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
