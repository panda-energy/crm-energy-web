/**
 * Tema Clerk alineado con los tokens del design system.
 *
 * Clerk acepta CSS variables (con `var(...)`) en su prop `appearance` y las
 * reusa internamente. Apuntamos a las mismas variables semánticas que
 * `globals.css` para que el componente respete dark mode automáticamente
 * (la clase `.dark` en <html> cambia los valores de `--brand`, etc.).
 *
 * Reglas:
 *  - Cero colores hardcoded. Todo `var(--token)`.
 *  - No imponemos tipografía: Clerk hereda `font-family` del body.
 *  - Radios: `var(--radius-md)` para inputs, `var(--radius-lg)` para cards.
 *
 * El tipo `Appearance` vive en `@clerk/types` pero no se reexporta desde
 * `@clerk/nextjs`; lo dejamos como `const` y lo pasamos directamente a
 * `<ClerkProvider appearance={...}>` — TypeScript valida la forma en uso.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--brand)",
    colorTextOnPrimaryBackground: "var(--brand-foreground)",
    colorBackground: "var(--surface)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--danger)",
    colorSuccess: "var(--success)",
    colorWarning: "var(--warning)",
    colorNeutral: "var(--muted-foreground)",
    borderRadius: "var(--radius-md)",
  },
  elements: {
    card: "bg-surface border-border shadow-3",
    formButtonPrimary:
      "bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-ring",
    socialButtonsBlockButton: "border-border hover:bg-muted",
    formFieldInput:
      "bg-background border-input text-foreground focus-visible:ring-2 focus-visible:ring-ring",
    footerActionLink: "text-brand hover:underline",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
  },
} as const;
