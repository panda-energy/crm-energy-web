"use client";

import { motion } from "framer-motion";
import {
  Users, Columns3, MapPin, FileSignature, RefreshCw,
  Brain, Headphones, Network, Globe, Smartphone,
} from "lucide-react";
import { useInView } from "./use-in-view";

const MODULES = [
  {
    icon: Users,
    name: "Leads y captacion",
    desc: "WhatsApp, formulario, CSV. Enrichment automatico, acciones en lote, barra de comandos rapida.",
    span: "md:col-span-2 md:row-span-2",
    featured: true,
  },
  {
    icon: Columns3,
    name: "Pipeline visual",
    desc: "Kanban drag & drop. Etapas configurables por comercializadora.",
    span: "md:col-span-1",
  },
  {
    icon: MapPin,
    name: "CUPS y SIPS",
    desc: "Consulta oficial con un clic. Distribuidora, potencia, tarifa, consumo.",
    span: "md:col-span-1",
  },
  {
    icon: FileSignature,
    name: "Contratos y firma",
    desc: "Wizard guiado. PDF auto-generado. Firma remota eIDAS o presencial en pantalla.",
    span: "md:col-span-1",
  },
  {
    icon: RefreshCw,
    name: "ATR y switching",
    desc: "XML CNMC automatico. Envio SFTP a 5 distribuidoras. Tracking y reintentos.",
    span: "md:col-span-1",
  },
  {
    icon: Brain,
    name: "Agentes IA",
    desc: "Lead Concierge + ATR Back-office. Supervision humana. Trazabilidad completa.",
    span: "md:col-span-2",
    ai: true,
  },
  {
    icon: Headphones,
    name: "Atencion al cliente",
    desc: "Bandeja unificada. SLA visual. Historial 360.",
    span: "md:col-span-1",
  },
  {
    icon: Network,
    name: "Canales y comisiones",
    desc: "Brokers, marca blanca. Calculo y liquidacion automatica.",
    span: "md:col-span-1",
  },
  {
    icon: Globe,
    name: "Portal cliente",
    desc: "Consumo, facturas, potencia. Personalizable con tu marca.",
    span: "md:col-span-1",
  },
  {
    icon: Smartphone,
    name: "App movil",
    desc: "Escanear factura, simular, firmar. Flujo completo en campo.",
    span: "md:col-span-1",
  },
] as const;

export function Modules() {
  const { ref, inView } = useInView();

  return (
    <section id="modulos" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            Modulos
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            10 modulos.{" "}
            <span className="text-zinc-500">Cero integraciones que mantener.</span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="mt-14 grid gap-3 md:grid-cols-4">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const isAi = "ai" in mod && mod.ai;
            const isFeatured = "featured" in mod && mod.featured;
            return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 transition-all hover:border-zinc-700/60 ${mod.span}`}
              style={{ perspective: "800px" }}
            >
              {/* Hover glow */}
              <div className={`pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                isAi ? "bg-gradient-to-b from-violet-500/10 via-transparent to-violet-500/5" :
                "bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-500/5"
              }`} />

              <div className="relative flex h-full flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${
                    isAi ? "bg-violet-500/10" : "bg-emerald-500/10"
                  }`}>
                    <Icon className={`size-4.5 ${isAi ? "text-violet-400" : "text-emerald-400"}`} />
                  </div>
                  {isAi && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 uppercase tracking-wider">
                      IA
                    </span>
                  )}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-white">{mod.name}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{mod.desc}</p>

                {isFeatured && (
                  <div className="mt-auto pt-6">
                    {/* Mini mockup: lead table */}
                    <div className="rounded-lg border border-zinc-800/40 bg-zinc-950/60 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-2 w-20 rounded bg-zinc-800" />
                        <div className="ml-auto h-5 w-12 rounded bg-emerald-500/20" />
                      </div>
                      {[1, 2, 3].map((r) => (
                        <div key={r} className="flex items-center gap-2 border-t border-zinc-800/30 py-2">
                          <div className="size-5 rounded-full bg-zinc-800" />
                          <div className="h-2 w-24 rounded bg-zinc-800" />
                          <div className="ml-auto h-4 w-14 rounded bg-zinc-800/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            );
           })}
        </div>
      </div>
    </section>
  );
}
