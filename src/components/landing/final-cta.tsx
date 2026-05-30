"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useInView } from "./use-in-view";

export function FinalCTA() {
  const { ref, inView } = useInView(0.3);

  return (
    <section id="demo" className="relative overflow-hidden bg-[#09090B] py-32" ref={ref}>
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_60%,rgba(16,185,129,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_60%_40%,rgba(6,182,212,0.05),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Deja de pelear con Excel{" "}
            <br className="hidden md:block" />
            y empieza a{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              vender energia
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Solicita tu demo personalizada y descubre como Kuro Energy
            transforma tus operaciones en semanas, no meses.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="mailto:hola@kuro.energy"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-900 transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            <span className="relative z-10">Solicitar demo</span>
            <ArrowRight className="relative z-10 size-4 transition-transform group-hover:translate-x-0.5" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </a>
          <a
            href="https://wa.me/34600000000"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-8 py-4 text-sm font-medium text-zinc-300 transition-all hover:border-emerald-500/30 hover:text-white"
          >
            <MessageCircle className="size-4" />
            Escribenos por WhatsApp
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-xs text-zinc-600"
        >
          Sin compromiso. Sin permanencia. Respuesta en menos de 24h.
        </motion.p>
      </div>
    </section>
  );
}
