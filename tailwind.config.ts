// Tailwind v4 toma la mayor parte de su configuración desde CSS (`@theme` en
// `globals.css`). Este archivo cubre los flags que TODAVÍA viven en JS y
// sirve como hook para plugins futuros (typography, forms, animate).
import type { Config } from "tailwindcss";

const config: Config = {
  // Estrategia de dark mode requerida por backlog (regla dura #10).
  // En Tailwind v4 esto se controla con `darkMode: ['class']` desde JS.
  darkMode: ["class"],
  // Tailwind v4 detecta contenido automáticamente desde el árbol del proyecto,
  // pero lo declaramos explícito por compatibilidad con IDE/intellisense.
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  // Sin plugins por ahora. Los tokens viven 100% en `globals.css` vía `@theme`.
  plugins: [],
};

export default config;
