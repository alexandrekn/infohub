import { Resend } from "resend";
import { env } from "../../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Envia um e-mail via Resend. Se RESEND_API_KEY não estiver configurada
 * (padrão em ambiente de desenvolvimento sem conta criada ainda), só
 * registra no console — nada quebra, e dá pra ver exatamente o que seria
 * enviado e para quem.
 */
export async function enviarEmail(destinatario: string, assunto: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`\n[e-mail simulado — RESEND_API_KEY não configurada]`);
    console.log(`Para: ${destinatario}`);
    console.log(`Assunto: ${assunto}\n`);
    return;
  }

  try {
    const resultado = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: destinatario,
      subject: assunto,
      html,
    });
    if (resultado.error) {
      console.error("Resend recusou o envio:", resultado.error);
    }
  } catch (err) {
    // Falha de e-mail nunca deve derrubar a ação principal (criar tarefa, aprovar, etc).
    console.error("Erro ao enviar e-mail via Resend:", err);
  }
}

export async function enviarEmails(destinatarios: string[], assunto: string, html: string): Promise<void> {
  await Promise.all(destinatarios.map((d) => enviarEmail(d, assunto, html)));
}
