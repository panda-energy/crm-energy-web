"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useInView } from "./use-in-view";

const FAQS = [
  {
    q: "Que tipo de comercializadoras pueden usar Kuro?",
    a: "Comercializadoras pequenas y medianas (5.000 a 200.000 CUPS), cooperativas energeticas, brokers, asesores energeticos y agregadores de comunidades energeticas.",
  },
  {
    q: "Necesito instalar algo?",
    a: "No. Solo necesitas un navegador y conexion a internet. La app movil se descarga desde App Store o Google Play.",
  },
  {
    q: "Cuanto tarda la implementacion?",
    a: "Entre 2 y 4 semanas, incluyendo migracion de datos, configuracion y formacion del equipo.",
  },
  {
    q: "Puedo personalizar con mi marca?",
    a: "Si. El portal del cliente, documentos (presupuestos, contratos) y canales de comunicacion pueden llevar tu logo y colores.",
  },
  {
    q: "Mis datos estan seguros?",
    a: "Datos almacenados en la UE, aislamiento total entre comercializadoras (Row-Level Security), cifrado en transito y reposo, cumplimiento RGPD completo.",
  },
  {
    q: "La IA toma decisiones sola?",
    a: "No. Los agentes IA operan con supervision humana obligatoria para acciones criticas. Cada accion queda registrada con trazabilidad completa.",
  },
  {
    q: "Que distribuidoras estan soportadas?",
    a: "e-distribucion, i-DE, UFD, Viesgo y Begasa. Cobertura de mas del 80% del mercado espanol. Portugal en roadmap.",
  },
  {
    q: "Puedo probar antes de comprar?",
    a: "Si. Ofrecemos demo personalizada y piloto con grupo reducido antes de comprometer presupuesto. Sin permanencia.",
  },
] as const;

function FaqItem({ q, a, open, onToggle }: {
  q: string; a: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="border-b border-zinc-800/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="pr-4 text-[15px] font-medium text-white">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="size-4 text-zinc-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-zinc-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const { ref, inView } = useInView();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Preguntas frecuentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          {FAQS.map(({ q, a }, i) => (
            <FaqItem
              key={q}
              q={q}
              a={a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
