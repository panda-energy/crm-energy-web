"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18nStore, type Locale } from "@/lib/i18n";

const LOCALE_OPTIONS: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: "es", label: "ES" },
  { value: "ca", label: "CA" },
  { value: "pt", label: "PT" },
];

/**
 * Language selector dropdown for the topbar.
 *
 * Displays a globe icon with the current locale code.
 * Clicking opens a dropdown with the three supported locales.
 *
 * Accessibility: trigger has aria-label, menu items have descriptive text.
 */
export function LanguageSelector() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2 text-xs font-medium text-muted-foreground"
          aria-label={`Idioma actual: ${locale.toUpperCase()}. Cambiar idioma.`}
        >
          <Globe className="size-3.5" aria-hidden="true" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px]">
        {LOCALE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            className={locale === opt.value ? "bg-muted font-semibold" : ""}
          >
            {opt.label}
            {locale === opt.value ? (
              <span className="ml-auto text-xs text-brand" aria-hidden="true">
                *
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
