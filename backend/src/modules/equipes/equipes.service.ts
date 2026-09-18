import { pool } from "../../db/pool";
import { ApiError } from "../../utils/ApiError";
import { paraPublico } from "../auth/auth.service";
import type { AreaIdeia, StatusTarefa, Usuario } from "../../types";

export interface FiltrosEquipe {
  busca?: string;
  area?: AreaIdeia;
  turma?: string;
  idMentor?: number;
  idCurso?: number;
  statusTarefa?: StatusTarefa;
}

function linhaParaUsuario(row: any): Usuario {
  return {
    id_usuario: row.id_usuario,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    senha_hash: row.senha,
    perfil: row.perfil,
    id_curso: row.id_curso,
    semestre: row.semestre,
    ativo: row.ativo,
  };
}

async function comIntegrantes(idEquipe: number) {
  const { rows } = await pool.query(
    `SELECT eu.id_equipe_usuario, eu.id_equipe, eu.id_usuario, eu.papel, u.*
     FROM equipe_usuario eu
     JOIN usuario u ON u.id_usuario = eu.id_usuario
     WHERE eu.id_equipe = $1`,
    [idEquipe]
  );
  return rows.map((r) => ({
    id_equipe_usuario: r.id_equipe_usuario,
    id_equipe: r.id_equipe,
    id_usuario: r.id_usuario,
    papel: r.papel,
    usuario: paraPublico(linhaParaUsuario(r)),
  }));
}

async function comMentores(idEquipe: number) {
  const { rows } = await pool.query(
    `SELECT u.* FROM equipe_mentor em JOIN usuario u ON u.id_usuario = em.id_usuario WHERE em.id_equipe = $1`,
    [idEquipe]
  );
  return rows.map((r) => paraPublico(linhaParaUsuario(r)));
}

/** Etapas próprias desta equipe, em ordem — cada equipe tem seu próprio conjunto. */
async function comEtapas(idEquipe: number) {
  const { rows } = await pool.query(
    "SELECT id_etapa, id_equipe, nome, descricao, ordem FROM etapa WHERE id_equipe = $1 ORDER BY ordem",
    [idEquipe]
  );
  return rows;
}

async function compor(idEquipe: number) {
  const { rows } = await pool.query("SELECT * FROM equipe WHERE id_equipe = $1", [idEquipe]);
  const equipe = rows[0];
  if (!equipe) return null;

  const [integrantes, mentores, etapas] = await Promise.all([
    comIntegrantes(idEquipe),
    comMentores(idEquipe),
    comEtapas(idEquipe),
  ]);

  return {
    id_equipe: equipe.id_equipe,
    nome_equipe: equipe.nome_equipe,
    nome_ideia: equipe.nome_ideia,
    descricao_ideia: equipe.descricao_ideia,
    area_ideia: equipe.area_ideia,
    estagio_ideia: equipe.estagio_ideia,
    como_conheceu: equipe.como_conheceu,
    link_pitch: equipe.link_pitch,
    id_etapa_atual: equipe.id_etapa_atual,
    turma: equipe.turma,
    id_mentores: mentores.map((m) => m.id_usuario),
    mentores,
    integrantes,
    etapas,
  };
}

export const equipesService = {
  async listar(filtros: FiltrosEquipe) {
    const condicoes: string[] = [];
    const valores: unknown[] = [];

    if (filtros.area) {
      valores.push(filtros.area);
      condicoes.push(`e.area_ideia = $${valores.length}`);
    }
    if (filtros.turma) {
      valores.push(filtros.turma);
      condicoes.push(`e.turma = $${valores.length}`);
    }
    if (filtros.idMentor) {
      valores.push(filtros.idMentor);
      condicoes.push(`EXISTS (SELECT 1 FROM equipe_mentor em WHERE em.id_equipe = e.id_equipe AND em.id_usuario = $${valores.length})`);
    }
    if (filtros.idCurso) {
      valores.push(filtros.idCurso);
      condicoes.push(
        `EXISTS (SELECT 1 FROM equipe_usuario eu JOIN usuario u ON u.id_usuario = eu.id_usuario WHERE eu.id_equipe = e.id_equipe AND u.id_curso = $${valores.length})`
      );
    }
    if (filtros.statusTarefa) {
      valores.push(filtros.statusTarefa);
      condicoes.push(
        `EXISTS (SELECT 1 FROM tarefa t JOIN status_tarefa st ON st.id_status = t.id_status WHERE t.id_equipe = e.id_equipe AND st.descricao = $${valores.length})`
      );
    }
    if (filtros.busca?.trim()) {
      valores.push(`%${filtros.busca.trim()}%`);
      condicoes.push(`(e.nome_equipe ILIKE $${valores.length} OR e.nome_ideia ILIKE $${valores.length})`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
    const { rows } = await pool.query(`SELECT e.id_equipe FROM equipe e ${where} ORDER BY e.id_equipe`, valores);

    return Promise.all(rows.map((r) => compor(r.id_equipe)));
  },

  async buscarPorId(idEquipe: number) {
    const equipe = await compor(idEquipe);
    if (!equipe) throw ApiError.notFound("Equipe não encontrada.");
    return equipe;
  },

  async listarDoMentor(idMentor: number) {
    const { rows } = await pool.query("SELECT id_equipe FROM equipe_mentor WHERE id_usuario = $1", [idMentor]);
    return Promise.all(rows.map((r) => compor(r.id_equipe)));
  },

  async listarDoAluno(idUsuario: number) {
    const { rows } = await pool.query("SELECT id_equipe FROM equipe_usuario WHERE id_usuario = $1", [idUsuario]);
    return Promise.all(rows.map((r) => compor(r.id_equipe)));
  },

  async ehMentorDaEquipe(idEquipe: number, idUsuario: number): Promise<boolean> {
    const { rows } = await pool.query("SELECT 1 FROM equipe_mentor WHERE id_equipe = $1 AND id_usuario = $2", [idEquipe, idUsuario]);
    return rows.length > 0;
  },

  async ehIntegranteDaEquipe(idEquipe: number, idUsuario: number): Promise<boolean> {
    const { rows } = await pool.query("SELECT 1 FROM equipe_usuario WHERE id_equipe = $1 AND id_usuario = $2", [idEquipe, idUsuario]);
    return rows.length > 0;
  },

  // ---- Etapas da equipe (personalizáveis por equipe — padrão 6, mentor pode ajustar) ----
  async listarEtapas(idEquipe: number) {
    return comEtapas(idEquipe);
  },

  /** Acrescenta uma etapa ao final do funil desta equipe. */
  async adicionarEtapa(idEquipe: number, nome: string, descricao: string) {
    const { rows: maxRows } = await pool.query("SELECT COALESCE(MAX(ordem), 0) AS max FROM etapa WHERE id_equipe = $1", [idEquipe]);
    const novaOrdem = maxRows[0].max + 1;
    const { rows } = await pool.query(
      "INSERT INTO etapa (id_equipe, nome, descricao, ordem) VALUES ($1, $2, $3, $4) RETURNING id_etapa, id_equipe, nome, descricao, ordem",
      [idEquipe, nome, descricao, novaOrdem]
    );
    return rows[0];
  },

  /** Remove uma etapa desta equipe — não pode ser a etapa atual, nem ter tarefas associadas. */
  async removerEtapa(idEquipe: number, idEtapa: number) {
    const { rows: etapaRows } = await pool.query("SELECT * FROM etapa WHERE id_etapa = $1 AND id_equipe = $2", [idEtapa, idEquipe]);
    if (!etapaRows[0]) throw ApiError.notFound("Etapa não encontrada nesta equipe.");

    const { rows: equipeRows } = await pool.query("SELECT id_etapa_atual FROM equipe WHERE id_equipe = $1", [idEquipe]);
    if (equipeRows[0]?.id_etapa_atual === idEtapa) {
      throw ApiError.conflict("Não é possível remover a etapa em que a equipe está no momento.");
    }

    const { rows: tarefasRows } = await pool.query("SELECT 1 FROM tarefa WHERE id_etapa = $1 LIMIT 1", [idEtapa]);
    if (tarefasRows.length > 0) {
      throw ApiError.conflict("Não é possível remover uma etapa que já tem tarefas associadas.");
    }

    await pool.query("DELETE FROM etapa WHERE id_etapa = $1", [idEtapa]);
    return this.listarEtapas(idEquipe);
  },

  /** RF-09 — avançar etapa manualmente (admin ou mentor da equipe, ver RN-01). Segue a ordem própria da equipe. */
  async avancarEtapa(idEquipe: number) {
    const { rows } = await pool.query(
      `SELECT e.id_etapa_atual, et.ordem AS ordem_atual
       FROM equipe e LEFT JOIN etapa et ON et.id_etapa = e.id_etapa_atual
       WHERE e.id_equipe = $1`,
      [idEquipe]
    );
    if (!rows[0]) throw ApiError.notFound("Equipe não encontrada.");

    const { rows: proximaRows } = await pool.query(
      "SELECT id_etapa FROM etapa WHERE id_equipe = $1 AND ordem = $2",
      [idEquipe, (rows[0].ordem_atual ?? 0) + 1]
    );

    if (proximaRows[0]) {
      const novaEtapa = proximaRows[0].id_etapa;
      await pool.query("UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2", [novaEtapa, idEquipe]);
      await pool.query(
        "INSERT INTO historico_etapa (id_equipe, id_etapa) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [idEquipe, novaEtapa]
      );
    }
    return compor(idEquipe);
  },

  async retrocederEtapa(idEquipe: number) {
    const { rows } = await pool.query(
      `SELECT e.id_etapa_atual, et.ordem AS ordem_atual
       FROM equipe e LEFT JOIN etapa et ON et.id_etapa = e.id_etapa_atual
       WHERE e.id_equipe = $1`,
      [idEquipe]
    );
    if (!rows[0]) throw ApiError.notFound("Equipe não encontrada.");

    const { rows: anteriorRows } = await pool.query(
      "SELECT id_etapa FROM etapa WHERE id_equipe = $1 AND ordem = $2",
      [idEquipe, (rows[0].ordem_atual ?? 0) - 1]
    );

    if (anteriorRows[0]) {
      await pool.query("UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2", [anteriorRows[0].id_etapa, idEquipe]);
    }
    return compor(idEquipe);
  },

  async listarHistorico(idEquipe: number) {
    const { rows } = await pool.query(
      "SELECT id_equipe, id_etapa, data_entrada FROM historico_etapa WHERE id_equipe = $1 ORDER BY data_entrada",
      [idEquipe]
    );
    return rows;
  },
};
