import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { InviteEmail } from "@/lib/email/invite-template";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Kuro Energy <onboarding@resend.dev>";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role, inviterName } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "email, name y role son obligatorios" },
        { status: 400 },
      );
    }

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      manager: "Gestor",
      sales: "Comercial",
      support: "Soporte",
      viewer: "Solo lectura",
    };

    const inviteUrl = `https://app.kuro.energy/sign-up?invited=true&email=${encodeURIComponent(email)}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `${inviterName ?? "Tu equipo"} te ha invitado a Kuro Energy`,
      react: InviteEmail({
        inviteeName: name,
        inviterName: inviterName ?? "Tu equipo",
        role: roleLabels[role] ?? role,
        inviteUrl,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Invite API error:", err);
    return NextResponse.json(
      { error: "Error interno al enviar invitacion" },
      { status: 500 },
    );
  }
}
