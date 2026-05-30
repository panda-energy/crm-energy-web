"use client";

import { motion } from "framer-motion";
import {
  UserPlus, Search, Calculator, FileText, PenTool,
  Send, UserCheck, LayoutDashboard,
} from "lucide-react";
import { useInView } from "./use-in-view";

const STEPS = [
  { icon: UserPlus, label: "Lead" },
  { icon: Search, label: "SIPS" },
  { icon: Calculator, label: "Simulacion" },
  { icon: FileText, label: "Oferta" },
  { icon: PenTool, label: "Firma" },
  { icon: Send, label: "ATR" },
  { icon: UserCheck, label: "Activo" },
  { icon: LayoutDashboard, label: "Portal" },
] as const;

export function SolutionFlow() {
  const { ref, inView } = useInView(0.2);

  return (
    <section id="producto" className="relative overflow-hidden bg-[#09090B] py-32" ref={ref}>
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            La solucion
          </span>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            Todo el ciclo de vida del cliente.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Una sola plataforma.
            </span>
          </h2>
        </motion.div>

        {/* Flow timeline */}
        <div className="relative mt-20">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-zinc-800 lg:block">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500"
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-8">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative mb-3 flex size-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 transition-all group-hover:border-emerald-500/30 group-hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                  <Icon className="size-6 text-zinc-500 transition-colors group-hover:text-emerald-400" />
                  {/* Pulse dot */}
                  <motion.div
                    className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500"
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ delay: 0.8 + i * 0.12, type: "spring" }}
                  >
                    <div className="size-full rounded-full bg-emerald-500 animate-ping opacity-40" />
                  </motion.div>
                </div>
                <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 2, duration: 0.6 }}
          className="mt-12 text-center text-sm text-zinc-600"
        >
          Desde la captacion del lead hasta el autoservicio del cliente final. Todo automatizado, todo trazable.
        </motion.p>
      </div>
    </section>
  );
}
