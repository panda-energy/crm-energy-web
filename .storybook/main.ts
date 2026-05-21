import type { StorybookConfig } from "@storybook/nextjs-vite";
import { dirname, join } from "node:path";

/**
 * Storybook 9 — config principal.
 *
 * Framework: `@storybook/nextjs-vite` — variante Vite del framework Next.
 *
 * Por qué Vite (y por qué Storybook 9 en lugar de la 8 inicial):
 *  - **Vite** es ~3× más rápido que webpack5 en arranque y HMR. El instructivo
 *    explícitamente lo recomienda ("Vite es preferible por velocidad").
 *  - **Next 15 + React 19** ship con un webpack interno empaquetado que
 *    incompatibiliza con `@storybook/builder-webpack5` 8.x (TypeError
 *    "Cannot read properties of undefined (reading 'tap')" durante el shutdown
 *    del compiler). Storybook 9 expone `@storybook/nextjs-vite` con builder
 *    propio de Vite y resuelve el conflicto. Documentado en
 *    https://github.com/storybookjs/storybook/issues/29445.
 *  - **Storybook 9** (no 8) es la primera línea estable que declara peers
 *    compatibles con Next 15.x. Como funcionalmente cubre lo que pedía el
 *    plan (autodocs, controls, a11y, themes), subir es la opción correcta
 *    vs. fork local del builder.
 *
 * Stories: cualquier `*.stories.tsx` bajo `src/`.
 *
 * Addons:
 *  - `@storybook/addon-docs` — autodocs MDX + controles auto-generados (los
 *    "essentials" se desglosaron en SB9; docs ya incluye controls/actions).
 *  - `@storybook/addon-a11y` — panel WCAG (DoD: a11y limpia).
 *  - `@storybook/addon-themes` — toggle dark/light desde toolbar.
 *
 * Cuando DevOps active Chromatic, se añadirá `@chromatic-com/storybook` aquí
 * + un workflow en `crm-energy-infra`. No lo instalamos nosotros (boundary).
 */
const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-themes"),
  ],
  typescript: {
    // reason: el por defecto react-docgen es suficiente y mucho más rápido
    // en Tailwind v4 / monorepo que react-docgen-typescript.
    reactDocgen: "react-docgen",
  },
  staticDirs: ["../public"],
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}
