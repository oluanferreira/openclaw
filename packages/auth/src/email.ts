import { Resend } from "resend";

import { logger } from "@workspace/shared/logger";

import { env } from "./env";

const FROM = "ClaWin1Click <noreply@clawin1click.com>";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  const client = getResend();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping email to", to);
    return;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("Failed to send email", { to, subject, error });
  }
}

// ---------------------------------------------------------------------------
// Welcome Email
// ---------------------------------------------------------------------------

type Locale = "en" | "pt" | "es";

const WELCOME_SUBJECTS: Record<Locale, string> = {
  en: "Welcome to ClaWin1Click!",
  pt: "Bem-vindo ao ClaWin1Click!",
  es: "Bienvenido a ClaWin1Click!",
};

function getWelcomeSubject(locale: Locale): string {
  return WELCOME_SUBJECTS[locale];
}

function welcomeEmailHtml({
  name,
  locale = "en",
}: {
  name: string;
  locale?: Locale;
}): string {
  const copy = {
    en: {
      hi: `Hi ${name},`,
      welcome: "Welcome to ClaWin1Click!",
      body: "Your account has been created successfully. Your personal AI assistant is on its way — it works 24/7, learns from you, and is always ready to help.",
      cta: "Go to Dashboard",
      footer:
        "If you have any questions, just reply to this email or open a support ticket in the dashboard.",
      team: "— The ClaWin1Click Team",
    },
    pt: {
      hi: `Olá ${name},`,
      welcome: "Bem-vindo ao ClaWin1Click!",
      body: "Sua conta foi criada com sucesso. Seu assistente de IA pessoal está a caminho — ele trabalha 24/7, aprende com você e está sempre pronto para ajudar.",
      cta: "Ir para o Painel",
      footer:
        "Se tiver dúvidas, responda este e-mail ou abra um ticket de suporte no painel.",
      team: "— Equipe ClaWin1Click",
    },
    es: {
      hi: `Hola ${name},`,
      welcome: "¡Bienvenido a ClaWin1Click!",
      body: "Tu cuenta ha sido creada exitosamente. Tu asistente de IA personal está en camino — trabaja 24/7, aprende contigo y siempre está listo para ayudarte.",
      cta: "Ir al Panel",
      footer:
        "Si tienes preguntas, responde este correo o abre un ticket de soporte en el panel.",
      team: "— El Equipo ClaWin1Click",
    },
  } as const;

  const t = copy[locale];

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="background:#18181b;padding:28px 32px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">${t.welcome}</h1>
  </td></tr>
  <tr><td style="padding:32px">
    <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.6">${t.hi}</p>
    <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6">${t.body}</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="https://clawin1click.com/dashboard" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none">${t.cta}</a>
    </td></tr></table>
    <p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.5">${t.footer}</p>
    <p style="margin:16px 0 0;color:#71717a;font-size:13px">${t.team}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  email: string,
  name: string | null,
  locale: Locale = "en",
) {
  const displayName = name ?? email.split("@")[0]!;
  await sendEmail({
    to: email,
    subject: getWelcomeSubject(locale),
    html: welcomeEmailHtml({ name: displayName, locale }),
  });
}
