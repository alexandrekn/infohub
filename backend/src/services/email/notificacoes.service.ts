import { pool } from "../../db/pool";
import { enviarEmail, enviarEmails } from "./email.service";
import { emailTemplates } from "./email.templates";

async function emailsDosIntegrantes(idEquipe: number): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT u.email FROM equipe_usuario eu JOIN usuario u ON u.id_usuario = eu.id_usuario
     WHERE eu.id_equipe = $1 AND u.ativo = true`,
    [idEquipe]
  );
  return rows.map((r) => r.email);
}

async function emailsDosAdmins(): Promise<string[]> {
  const { rows } = await pool.query("SELECT email FROM usuario WHERE perfil = 'admin' AND ativo = true");
  return rows.map((r) => r.email);
}

/** RF-18/RF-19 — dispara os e-mails automáticos de cada evento do fluxo de tarefas/cadastro. */
export const notificacoesService = {
  async novoCadastro(nomeLider: string, nomeEquipe: string) {
    const admins = await emailsDosAdmins();
    if (admins.length === 0) return;
    const { assunto, html } = emailTemplates.adminNovoCadastro(nomeLider, nomeEquipe);
    await enviarEmails(admins, assunto, html);
  },

  async novaTarefa(idEquipe: number, nomeEquipe: string, titulo: string, dataLimite: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    if (destinatarios.length === 0) return;
    const { assunto, html } = emailTemplates.novaTarefa(nomeEquipe, titulo, dataLimite);
    await enviarEmails(destinatarios, assunto, html);
  },

  async lembretePrazo(idEquipe: number, nomeEquipe: string, titulo: string, dataLimite: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    if (destinatarios.length === 0) return;
    const { assunto, html } = emailTemplates.lembretePrazo(nomeEquipe, titulo, dataLimite);
    await enviarEmails(destinatarios, assunto, html);
  },

  async prazoVencido(idEquipe: number, nomeEquipe: string, titulo: string, dataLimite: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    const admins = await emailsDosAdmins();

    if (destinatarios.length > 0) {
      const { assunto, html } = emailTemplates.prazoVencido(nomeEquipe, titulo, dataLimite);
      await enviarEmails(destinatarios, assunto, html);
    }
    if (admins.length > 0) {
      const { assunto, html } = emailTemplates.adminTarefaAtrasada(nomeEquipe, titulo, dataLimite);
      await enviarEmails(admins, assunto, html);
    }
  },

  async entregaAprovada(idEquipe: number, nomeEquipe: string, titulo: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    if (destinatarios.length === 0) return;
    const { assunto, html } = emailTemplates.entregaAprovada(nomeEquipe, titulo);
    await enviarEmails(destinatarios, assunto, html);
  },

  async entregaReprovada(idEquipe: number, nomeEquipe: string, titulo: string, comentario: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    if (destinatarios.length === 0) return;
    const { assunto, html } = emailTemplates.entregaReprovada(nomeEquipe, titulo, comentario);
    await enviarEmails(destinatarios, assunto, html);
  },

  async arquivoEntregue(_idEquipe: number, nomeEquipe: string, titulo: string, nomeUsuario: string) {
    const admins = await emailsDosAdmins();
    if (admins.length === 0) return;
    const { assunto, html } = emailTemplates.adminArquivoEntregue(nomeEquipe, titulo, nomeUsuario);
    await enviarEmails(admins, assunto, html);
  },

  /** RF-20 — admin dispara um lembrete manual avulso para uma equipe específica. */
  async lembreteManual(idEquipe: number, nomeEquipe: string, mensagem: string) {
    const destinatarios = await emailsDosIntegrantes(idEquipe);
    if (destinatarios.length === 0) return;
    const { assunto, html } = emailTemplates.lembreteManual(nomeEquipe, mensagem);
    await enviarEmails(destinatarios, assunto, html);
  },
};

export { enviarEmail };
