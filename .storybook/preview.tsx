import type { Preview } from "@storybook/nextjs-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { ThemeProvider } from "next-themes";
import "../src/app/globals.css";

/**
 * Storybook — preview global.
 *
 * Decoradores aplicados en orden:
 *  1. `withThemeByClassName` — alterna la clase `.dark` en `<html>`
 *     desde la toolbar. Es el mecanismo que entiende nuestro
 *     `globals.css` (custom variant `@custom-variant dark (&:where(.dark, .dark *))`).
 *  2. `ThemeProvider` de next-themes con `enableSystem={false}` — asegura
 *     que cualquier componente que usa `useTheme()` (Toaster, ThemeToggle)
 *     reciba el valor que el toggle pone en `<html>`.
 *
 * i18n placeholder: locale `es` por defecto. Sprint 6 trae `next-intl` real;
 * por ahora las stories pueden hardcodear textos en castellano.
 *
 * Backgrounds: desactivados — los tokens (`bg-background`) se encargan.
 *
 * a11y: regla `color-contrast` desactivada porque axe-core no calcula bien
 * los colores `oklch()`; el contraste se valida manual y por revisión visual.
 */

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: false,
          },
        ],
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
    (Story) => (
      <ThemeProvider attribute="class" enableSystem={false}>
        <div className="bg-background text-foreground p-6">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  tags: ["autodocs"],
};

export default preview;
