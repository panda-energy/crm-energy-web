import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/settings` — configuración del tenant.
 *
 * Stub Sprint 6.
 */
export default function SettingsPage() {
  return (
    <ComingSoonPlaceholder
      title="Configuración"
      description="Identidad de marca, catálogo de productos, integraciones y equipo."
      sprintLabel="Sprint 6"
      iconKey="settings"
      bullets={[
        "Identidad visual del tenant: logo, colores brand, favicon.",
        "Catálogo de productos energéticos con tarifas y vigencias.",
        "Integraciones: WhatsApp Business, OCR de facturas, firma digital.",
        "Gestión de equipo: invitar, asignar roles, suspender accesos.",
        "Auditoría de cambios sensibles (RGPD) por usuario y fecha.",
      ]}
    />
  );
}
