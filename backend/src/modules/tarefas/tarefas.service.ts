import { pool } from "../../db/pool";
import { ApiError } from "../../utils/ApiError";
import { notificacoesService } from "../../services/email/notificacoes.service";
import type { CriarTarefaInput } from "./tarefas.schema";

const SELECT_TAREFA = `
  SELECT t.id_tarefa, t.titulo, t.descricao,
         to_char(t.data_limite, 'YYYY-MM-DD') AS data_limite,
         t.id_equipe, t.id_etapa, st.descricao AS status
  FROM tarefa t
  JOIN status_tarefa st ON st.id_status = t.id_status
`;

async function nomeDaEquipe(idEquipe: number): Promise<string> {
  const { rows } = await pool.query("SELECT nome_equipe FROM equipe WHERE id_equipe = $1", [idEquipe]);
  return rows[0]?.nome_equipe ?? "";
}

async function nomeDoUsuario(idUsuario: number): Promise<string> {
  const { rows } = await pool.query("SELECT nome FROM usuario WHERE id_usuario = $1", [idUsuario]);
  return rows[0]?.nome ?? "";
}

export const tarefasService = {
  async listarPorEquipe(idEquipe: number) {
    const { rows } = await pool.query(`${SELECT_TAREFA} WHERE t.id_equipe = $1 ORDER BY t.id_tarefa`, [idEquipe]);
    return rows;
  },

  async listarTodas() {
    const { rows } = await pool.query(`${SELECT_TAREFA} ORDER BY t.id_tarefa`);
    return rows;
  },

  async buscarPorId(idTarefa: number) {
    const { rows } = await pool.query(`${SELECT_TAREFA} WHERE t.id_tarefa = $1`, [idTarefa]);
    if (!rows[0]) throw ApiError.notFound("Tarefa não encontrada.");
    return rows[0];
  },

  /** RF-11/RF-17 — cria a tarefa, registra os lembretes automáticos e avisa a equipe (RF-18). */
  async criar(idEquipe: number, dados: CriarTarefaInput) {
    const { rows } = await pool.query(
      `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
       VALUES ($1, $2, $3, $4, $5, (SELECT id_status FROM status_tarefa WHERE descricao = 'Pendente'))
       RETURNING id_tarefa`,
      [dados.titulo, dados.descricao, dados.data_limite, idEquipe, dados.id_etapa]
    );
    const idTarefa = rows[0].id_tarefa as number;

    for (const data of dados.datas_lembrete) {
      if (!data) continue;
      await pool.query("INSERT INTO lembrete (data_programada, id_tarefa) VALUES ($1, $2)", [data, idTarefa]);
    }

    const tarefa = await this.buscarPorId(idTarefa);
    const nomeEquipe = await nomeDaEquipe(idEquipe);
    void notificacoesService.novaTarefa(idEquipe, nomeEquipe, tarefa.titulo, tarefa.data_limite);

    return tarefa;
  },

  /** RF-15 — aprova e avisa a equipe (RF-18). */
  async aprovar(idTarefa: number) {
    const tarefaAntes = await this.buscarPorId(idTarefa);
    await pool.query(
      "UPDATE tarefa SET id_status = (SELECT id_status FROM status_tarefa WHERE descricao = 'Aprovada') WHERE id_tarefa = $1",
      [idTarefa]
    );

    const nomeEquipe = await nomeDaEquipe(tarefaAntes.id_equipe);
    void notificacoesService.entregaAprovada(tarefaAntes.id_equipe, nomeEquipe, tarefaAntes.titulo);

    return this.buscarPorId(idTarefa);
  },

  /** RF-15 — reprova, registra o comentário como anotação interna e avisa a equipe (RF-18). */
  async reprovar(idTarefa: number, comentario: string, contexto: { idEquipe: number; idEtapa: number; idUsuario: number }) {
    const tarefa = await this.buscarPorId(idTarefa);
    await pool.query(
      "UPDATE tarefa SET id_status = (SELECT id_status FROM status_tarefa WHERE descricao = 'Reprovada/Ajustar') WHERE id_tarefa = $1",
      [idTarefa]
    );

    if (comentario.trim()) {
      await pool.query(
        `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES ($1, $2, $3, $4)`,
        [`Ajuste solicitado em "${tarefa.titulo}": ${comentario}`, contexto.idUsuario, contexto.idEquipe, contexto.idEtapa]
      );

      const nomeEquipe = await nomeDaEquipe(contexto.idEquipe);
      void notificacoesService.entregaReprovada(contexto.idEquipe, nomeEquipe, tarefa.titulo, comentario);
    }
    return this.buscarPorId(idTarefa);
  },

  /** Alterar prazo é restrito ao mentor da equipe — checagem fica no controller. */
  async alterarPrazo(idTarefa: number, novaData: string) {
    await this.buscarPorId(idTarefa);
    await pool.query("UPDATE tarefa SET data_limite = $1 WHERE id_tarefa = $2", [novaData, idTarefa]);
    return this.buscarPorId(idTarefa);
  },

  // ---- RF-14/RF-16: entregas com histórico de versões ----
  async listarEntregaveis(idTarefa: number) {
    const { rows } = await pool.query(
      `SELECT id_entregavel, arquivo_url, tipo, data_envio, id_tarefa, id_usuario, versao
       FROM entregavel WHERE id_tarefa = $1 ORDER BY versao`,
      [idTarefa]
    );
    return rows.map((r) => ({ ...r, data_envio: new Date(r.data_envio).toISOString() }));
  },

  /** RF-14 — aceita tanto um link quanto o caminho de um arquivo enviado por upload real. */
  async anexarEntrega(idTarefa: number, idUsuario: number, arquivoUrl: string, tipo: string) {
    const { rows: versaoRows } = await pool.query("SELECT COUNT(*)::int AS total FROM entregavel WHERE id_tarefa = $1", [idTarefa]);
    const novaVersao = versaoRows[0].total + 1;

    const { rows } = await pool.query(
      `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario, versao)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_entregavel, arquivo_url, tipo, data_envio, id_tarefa, id_usuario, versao`,
      [arquivoUrl, tipo, idTarefa, idUsuario, novaVersao]
    );

    const tarefa = await this.buscarPorId(idTarefa);
    if (tarefa.status !== "Aprovada") {
      await pool.query(
        "UPDATE tarefa SET id_status = (SELECT id_status FROM status_tarefa WHERE descricao = 'Entregue') WHERE id_tarefa = $1",
        [idTarefa]
      );
    }

    const [nomeEquipe, nomeUsuario] = await Promise.all([nomeDaEquipe(tarefa.id_equipe), nomeDoUsuario(idUsuario)]);
    void notificacoesService.arquivoEntregue(tarefa.id_equipe, nomeEquipe, tarefa.titulo, nomeUsuario);

    return { ...rows[0], data_envio: new Date(rows[0].data_envio).toISOString() };
  },
};
