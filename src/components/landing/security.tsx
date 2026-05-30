"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, MapPin, Lock, KeyRound,
  PenTool, Shield, Database, Brain,
} from "lucide-react";
import { useInView } from "./use-in-view";

const BADGES = [
  { icon: ShieldCheck, label: "RGPD compliant", desc: "Acceso, portabilidad y supresion de datos" },
  { icon: MapPin, label: "Datos en la UE", desc: "Almacenamiento exclusivo en centros europeos" },
  { icon: Lock, label: "Aislamiento total", desc: "Row-Level Security entre comercializadoras" },
  { icon: KeyRound, label: "Cifrado extremo", desc: "HTTPS en transito, cifrado en reposo" },
  { icon: PenTool, label: "Firma legal eIDAS", desc: "Validez juridica en toda la Union Europea" },
  { icon: Shield, label: "WAF + rate limiting", desc: "Cloudflare con reglas OWASP y geo-restriccion" },
  { icon: Database, label: "Backups automaticos", desc: "Copias semanales en Cloudflare R2 EU" },
  { icon: Brain, label: "Auditorias IA", desc: "Cada accion de agentes registrada y trazable" },
] as const;

export function Security() {
  const { ref, inView } = useInView();

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
            Seguridad
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Tus datos. Tu control.{" "}
            <span className="text-zinc-500">Nuestra obsesion.</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
              className="group flex items-start gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-4 transition-colors hover:border-emerald-500/20"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Icon className="size-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{label}</h3>
                <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
