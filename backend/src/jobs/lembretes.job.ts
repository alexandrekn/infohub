import { pool } from "../db/pool";
import { notificacoesService } from "../services/email/notificacoes.service";

/**
 * RF-17/RF-18 — envia os lembretes cuja data programada já chegou e ainda
 * não foram enviados, marcando-os como enviados na sequência.
 */
async function dispararLembretesPendentes() {
  const { rows } = await pool.query(`
    SELECT l.id_lembrete, t.id_tarefa, t.titulo, to_char(t.data_limite, 'YYYY-MM-DD') AS data_limite,
           t.id_equipe, e.nome_equipe
    FROM lembrete l
    JOIN tarefa t ON t.id_tarefa = l.id_tarefa
    JOIN equipe e ON e.id_equipe = t.id_equipe
    WHERE l.enviado = false AND l.data_programada <= CURRENT_DATE
  `);

  for (const lembrete of rows) {
    await notificacoesService.lembretePrazo(lembrete.id_equipe, lembrete.nome_equipe, lembrete.titulo, lembrete.data_limite);
    await pool.query("UPDATE lembrete SET enviado = true WHERE id_lembrete = $1", [lembrete.id_lembrete]);
  }

  if (rows.length > 0) console.log(`[lembretes] ${rows.length} lembrete(s) de prazo enviado(s).`);
}

/**
 * RN-04 — tarefas vencidas sem entrega viram "Atrasada" automaticamente,
 * e a equipe + o admin são avisados (RF-18/RF-19).
 */
async function marcarTarefasAtrasadas() {
  const { rows } = await pool.query(`
    SELECT t.id_tarefa, t.titulo, to_char(t.data_limite, 'YYYY-MM-DD') AS data_limite, t.id_equipe, e.nome_equipe
    FROM tarefa t
    JOIN status_tarefa st ON st.id_status = t.id_status
    JOIN equipe e ON e.id_equipe = t.id_equipe
    WHERE t.data_limite < CURRENT_DATE AND st.descricao NOT IN ('Aprovada', 'Atrasada')
  `);

  for (const tarefa of rows) {
    await pool.query(
      "UPDATE tarefa SET id_status = (SELECT id_status FROM status_tarefa WHERE descricao = 'Atrasada') WHERE id_tarefa = $1",
      [tarefa.id_tarefa]
    );
    await notificacoesService.prazoVencido(tarefa.id_equipe, tarefa.nome_equipe, tarefa.titulo, tarefa.data_limite);
  }

  if (rows.length > 0) console.log(`[lembretes] ${rows.length} tarefa(s) marcada(s) como atrasada(s).`);
}

async function rodarVerificacao() {
  try {
    await dispararLembretesPendentes();
    await marcarTarefasAtrasadas();
  } catch (err) {
    console.error("[lembretes] Erro ao verificar lembretes/atrasos:", err);
  }
}

/** Chamado uma vez em server.ts — roda logo na subida e depois a cada INTERVALO_LEMBRETES_MIN. */
export function iniciarJobDeLembretes(intervaloMinutos: number) {
  void rodarVerificacao();
  setInterval(rodarVerificacao, intervaloMinutos * 60 * 1000);
}

/** Exposto à parte para poder ser chamado manualmente (ex.: num teste). */
export const lembretesJob = { dispararLembretesPendentes, marcarTarefasAtrasadas, rodarVerificacao };
