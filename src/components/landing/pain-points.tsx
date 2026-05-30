"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, Unplug, Smartphone, Sparkles } from "lucide-react";
import { useInView } from "./use-in-view";

const PAINS = [
  {
    icon: FileSpreadsheet,
    title: "Procesos ATR manuales",
    desc: "Generar XMLs a mano, enviar por SFTP, rastrear respuestas en bandejas de correo. Errores constantes, rechazos evitables, horas perdidas.",
    accent: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-400",
  },
  {
    icon: Unplug,
    title: "Informacion dispersa",
    desc: "Excel de leads, PDF de contratos, correos con distribuidoras, WhatsApp con clientes. Nada conectado, nada trazable.",
    accent: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Smartphone,
    title: "Equipos de campo sin herramientas",
    desc: "Comerciales que vuelven a la oficina para cargar datos. Oportunidades que se enfrian mientras el lead espera.",
    accent: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: Sparkles,
    title: 'IA "de juguete"',
    desc: "Chatbots que no saben que es un CUPS, un C1 o una tarifa 2.0TD. Automatizacion cosmetica que no mueve la aguja.",
    accent: "from-pink-500/20 to-red-500/20",
    iconColor: "text-pink-400",
  },
] as const;

export function PainPoints() {
  const { ref, inView } = useInView();

  return (
    <section className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="text-sm font-medium tracking-wider text-zinc-500 uppercase">
            El problema
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Las comercializadoras pierden tiempo{" "}
            <span className="text-zinc-500">(y contratos)</span>{" "}
            con herramientas que no entienden su negocio
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PAINS.map(({ icon: Icon, title, desc, accent, iconColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700/60"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${accent} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-zinc-800/80">
                  <Icon className={`size-5 ${iconColor}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
