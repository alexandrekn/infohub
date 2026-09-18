import { env } from "../../config/env";

function layout(titulo: string, corpo: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #EA4B34, #F6A823); border-radius: 12px 12px 0 0; padding: 20px 24px;">
        <strong style="color: #fff; font-size: 18px;">InfoHub</strong>
      </div>
      <div style="background: #ffffff; border: 1px solid #E2E5F0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <h2 style="color: #16223F; margin: 0 0 12px;">${titulo}</h2>
        <div style="color: #374151; font-size: 14px; line-height: 1.6;">${corpo}</div>
        <p style="margin-top: 24px;">
          <a href="${env.APP_URL}" style="color: #EA4B34; font-weight: 600; text-decoration: none;">Acessar o InfoHub →</a>
        </p>
      </div>
    </div>
  `;
}

function dataFormatada(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export const emailTemplates = {
  // ---- RF-18: notificações para o aluno ----
  novaTarefa(nomeEquipe: string, titulo: string, dataLimite: string) {
    return {
      assunto: `Nova tarefa para ${nomeEquipe}: ${titulo}`,
      html: layout(
        "Nova tarefa atribuída",
        `A equipe <strong>${nomeEquipe}</strong> recebeu uma nova tarefa:<br><br>
         <strong>${titulo}</strong><br>
         Prazo: ${dataFormatada(dataLimite)}`
      ),
    };
  },

  lembretePrazo(nomeEquipe: string, titulo: string, dataLimite: string) {
    return {
      assunto: `Lembrete: prazo se aproximando — ${titulo}`,
      html: layout(
        "Prazo se aproximando",
        `A tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong> vence em
         <strong>${dataFormatada(dataLimite)}</strong>. Não esqueça de entregar a tempo!`
      ),
    };
  },

  prazoVencido(nomeEquipe: string, titulo: string, dataLimite: string) {
    return {
      assunto: `Prazo vencido: ${titulo}`,
      html: layout(
        "Prazo vencido sem entrega",
        `A tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong> venceu em
         ${dataFormatada(dataLimite)} e ainda não foi entregue. Fale com seu mentor se precisar de mais prazo.`
      ),
    };
  },

  entregaAprovada(nomeEquipe: string, titulo: string) {
    return {
      assunto: `Entrega aprovada: ${titulo}`,
      html: layout(
        "Entrega aprovada 🎉",
        `A entrega da tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong> foi aprovada pelo mentor.`
      ),
    };
  },

  entregaReprovada(nomeEquipe: string, titulo: string, comentario: string) {
    return {
      assunto: `Ajuste solicitado: ${titulo}`,
      html: layout(
        "Ajuste solicitado",
        `O mentor pediu um ajuste na entrega da tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong>:<br><br>
         <em>"${comentario}"</em>`
      ),
    };
  },

  lembreteManual(nomeEquipe: string, mensagem: string) {
    return {
      assunto: `Lembrete do InfoHub — ${nomeEquipe}`,
      html: layout("Lembrete", `${mensagem || "Passando para lembrar você de acompanhar as tarefas pendentes da sua equipe."}`),
    };
  },

  // ---- RF-19: notificações para o admin ----
  adminNovoCadastro(nomeLider: string, nomeEquipe: string) {
    return {
      assunto: `Novo cadastro recebido: ${nomeEquipe}`,
      html: layout(
        "Novo cadastro no InfoHub",
        `${nomeLider} acabou de enviar a ideia <strong>${nomeEquipe}</strong> — já está na Etapa 1 do funil.`
      ),
    };
  },

  adminArquivoEntregue(nomeEquipe: string, titulo: string, nomeUsuario: string) {
    return {
      assunto: `Nova entrega: ${nomeEquipe} — ${titulo}`,
      html: layout(
        "Arquivo entregue",
        `${nomeUsuario} enviou uma entrega para a tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong>.`
      ),
    };
  },

  adminTarefaAtrasada(nomeEquipe: string, titulo: string, dataLimite: string) {
    return {
      assunto: `Tarefa atrasada: ${nomeEquipe} — ${titulo}`,
      html: layout(
        "Tarefa atrasada",
        `A tarefa <strong>${titulo}</strong> da equipe <strong>${nomeEquipe}</strong> venceu em
         ${dataFormatada(dataLimite)} sem entrega.`
      ),
    };
  },
};
