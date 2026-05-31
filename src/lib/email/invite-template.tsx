import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InviteEmailProps {
  inviteeName: string;
  inviterName?: string;
  role: string;
  inviteUrl: string;
}

export function InviteEmail({
  inviteeName = "Nombre",
  inviterName = "Tu equipo",
  role = "Comercial",
  inviteUrl = "https://app.kuro.energy/sign-up",
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} te ha invitado a unirte a Kuro Energy
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logoIcon}>&#9889;</div>
              <span style={logoText}>Kuro</span>
            </div>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>
              Te han invitado a Kuro Energy
            </Heading>

            <Text style={paragraph}>
              Hola <strong>{inviteeName}</strong>,
            </Text>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> te ha invitado a unirte al equipo en
              Kuro Energy como <strong>{role}</strong>.
            </Text>

            <Text style={paragraph}>
              Kuro es el CRM con IA para comercializadoras de energia en Europa.
              Automatiza procesos ATR, captura leads, firma contratos digitalmente
              y gestiona toda tu cartera desde una unica plataforma inteligente.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={inviteUrl}>
                Aceptar invitacion
              </Button>
            </Section>

            <Text style={smallText}>
              O copia y pega esta URL en tu navegador:
            </Text>
            <Text style={urlText}>{inviteUrl}</Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Kuro Energy — CRM con IA para comercializadoras de energia en Europa
            </Text>
            <Text style={footerSubtext}>
              Este email fue enviado porque alguien te invito a unirte a Kuro Energy.
              Si no esperabas esta invitacion, puedes ignorar este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// -- Styles (inline for email compatibility) ----------------------------------

const body: React.CSSProperties = {
  backgroundColor: "#09090B",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#09090B",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px 20px",
};

const header: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "0 0 32px 0",
};

const logoContainer: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
};

const logoIcon: React.CSSProperties = {
  backgroundColor: "#10B981",
  borderRadius: "8px",
  color: "#fff",
  display: "inline-block",
  fontSize: "18px",
  height: "36px",
  lineHeight: "36px",
  textAlign: "center" as const,
  width: "36px",
};

const logoText: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const content: React.CSSProperties = {
  backgroundColor: "#18181B",
  border: "1px solid #27272A",
  borderRadius: "16px",
  padding: "40px 32px",
};

const heading: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1.3",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const paragraph: React.CSSProperties = {
  color: "#A1A1AA",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#10B981",
  borderRadius: "9999px",
  color: "#FFFFFF",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const smallText: React.CSSProperties = {
  color: "#71717A",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const urlText: React.CSSProperties = {
  color: "#10B981",
  fontSize: "12px",
  margin: "0",
  wordBreak: "break-all" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#27272A",
  borderTop: "1px solid #27272A",
  margin: "32px 0",
};

const footer: React.CSSProperties = {
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#52525B",
  fontSize: "13px",
  margin: "0 0 8px 0",
};

const footerSubtext: React.CSSProperties = {
  color: "#3F3F46",
  fontSize: "11px",
  lineHeight: "1.5",
  margin: "0",
};
