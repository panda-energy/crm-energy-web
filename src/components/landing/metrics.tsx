"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "./use-in-view";

const STATS = [
  { end: 5, suffix: "", label: "distribuidoras conectadas", detail: ">80% mercado espanol" },
  { end: 3, suffix: "", label: "flujos ATR automatizados", detail: "C1, A3, B1" },
  { end: 604, suffix: "", label: "tests automatizados", detail: "backend + integracion" },
  { end: 10, suffix: "", label: "modulos integrados", detail: "zero integraciones externas" },
  { end: 1, suffix: "s", label: "latencia p95", prefix: "<", detail: "respuesta garantizada" },
  { end: 99.5, suffix: "%", label: "uptime SLO", detail: "disponibilidad comprometida" },
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
            Numeros que hablan
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="relative rounded-2xl border border-zinc-800/40 bg-zinc-900/20 p-6 text-center"
            >
              <div className="text-4xl font-bold text-white md:text-5xl">
                <Counter end={stat.end} suffix={stat.suffix} prefix={"prefix" in stat ? stat.prefix : ""} inView={inView} />
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-400">{stat.label}</div>
              <div className="mt-1 text-xs text-zinc-600">{stat.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
