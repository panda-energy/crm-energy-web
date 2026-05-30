"use client";

import { motion } from "framer-motion";
import {
  MessageCircle, PenTool, Database, Building2,
  TrendingUp, Shield, Cloud, Brain,
} from "lucide-react";
import { useInView } from "./use-in-view";

const INTEGRATIONS = [
  { icon: MessageCircle, name: "WhatsApp Business", desc: "Comunicacion bidireccional y captacion automatica de leads" },
  { icon: PenTool, name: "Signaturit", desc: "Firma electronica con validez legal europea eIDAS" },
  { icon: Database, name: "CNMC / SIPS", desc: "Datos oficiales de puntos de suministro en tiempo real" },
  { icon: Building2, name: "5 distribuidoras", desc: "e-distribucion, i-DE, UFD, Viesgo, Begasa — cobertura >80%" },
  { icon: TrendingUp, name: "OMIE", desc: "Precios mayoristas hora a hora para tarifas indexadas" },
  { icon: Brain, name: "Claude + OpenAI", desc: "IA de grado empresarial con fallback automatico" },
  { icon: Shield, name: "Clerk", desc: "Autenticacion segura con SSO (Google, Microsoft)" },
  { icon: Cloud, name: "Cloudflare R2", desc: "Almacenamiento cifrado en centros de datos UE" },
] as const;

function Marquee() {
  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-[#09090B] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[#09090B] to-transparent" />
      <div className="flex animate-marquee gap-8">
        {[...INTEGRATIONS, ...INTEGRATIONS].map(({ icon: Icon, name }, i) => (
          <div
            key={`${name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-zinc-800/40 bg-zinc-900/40 px-5 py-2.5"
          >
            <Icon className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-400 whitespace-nowrap">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Integrations() {
  const { ref, inView } = useInView();

  return (
    <section id="integraciones" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            Integraciones
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Conectado con todo lo que necesitas
          </h2>
        </motion.div>

        <Marquee />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map(({ icon: Icon, name, desc }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
              className="group rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-5 transition-colors hover:border-zinc-700/60"
            >
              <Icon className="mb-3 size-5 text-zinc-600 transition-colors group-hover:text-emerald-400" />
              <h3 className="mb-1 text-sm font-semibold text-white">{name}</h3>
              <p className="text-xs leading-relaxed text-zinc-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
