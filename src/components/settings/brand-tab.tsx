"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/lib/ui/toast";
import { useTranslations } from "@/lib/i18n";

/**
 * Brand settings tab -- logo upload, primary/secondary color pickers,
 * mini preview sidebar.
 */
export function BrandTab() {
  const { t } = useTranslations();
  const [primaryColor, setPrimaryColor] = useState("#2E7D32");
  const [secondaryColor, setSecondaryColor] = useState("#5C6BC0");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setLogoName(file.name);
      toast.success(`Logo "${file.name}" cargado`);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLogoName(file.name);
        toast.success(`Logo "${file.name}" cargado`);
      }
    },
    [],
  );

  const handleSave = () => {
    toast.success("Marca actualizada");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identidad visual</CardTitle>
          <CardDescription>Logo y colores de la comercializadora</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragOver
                  ? "border-brand bg-brand/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {logoName
                  ? `Archivo: ${logoName}`
                  : "Arrastra tu logo aqui o haz clic para seleccionar"}
              </p>
              <label className="cursor-pointer">
                <span className="text-sm font-medium text-brand hover:underline">
                  Seleccionar archivo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileInput}
                  aria-label="Subir logo"
                />
              </label>
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="size-10 cursor-pointer rounded border border-border"
                  aria-label="Color primario"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  aria-label="Codigo de color primario"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary-color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="size-10 cursor-pointer rounded border border-border"
                  aria-label="Color secundario"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  aria-label="Codigo de color secundario"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave}>{t("actions.save")}</Button>
        </CardContent>
      </Card>

      {/* Mini sidebar preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>Asi se vera tu sidebar</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="w-48 rounded-lg border border-border bg-surface p-3"
            role="img"
            aria-label="Vista previa del sidebar con colores personalizados"
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex size-7 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {logoName ? "L" : "P"}
              </div>
              <span className="text-sm font-semibold text-foreground">Mi Empresa</span>
            </div>
            <div className="space-y-1">
              {["Dashboard", "Leads", "Pipeline", "CUPS"].map((label) => (
                <div
                  key={label}
                  className="rounded px-2 py-1 text-xs text-muted-foreground"
                  style={
                    label === "Dashboard"
                      ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                      : undefined
                  }
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
