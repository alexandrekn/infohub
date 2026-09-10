import { equipeUsuarios, equipes, historicoEtapas, etapas, tarefas, usuarios } from "../../data/store";
import { ApiError } from "../../utils/ApiError";
import { paraPublico } from "../auth/auth.service";
import type { AreaIdeia, StatusTarefa } from "../../types";

export interface FiltrosEquipe {
  busca?: string;
  area?: AreaIdeia;
  turma?: string;
  idMentor?: number;
  idCurso?: number;
  statusTarefa?: StatusTarefa;
}

function comIntegrantes(idEquipe: number) {
  return equipeUsuarios
    .filter((eu) => eu.id_equipe === idEquipe)
    .map((eu) => {
      const usuario = usuarios.find((u) => u.id_usuario === eu.id_usuario);
      return { ...eu, usuario: usuario ? paraPublico(usuario) : null };
    });
}

function compor(idEquipe: number) {
  const equipe = equipes.find((e) => e.id_equipe === idEquipe);
  if (!equipe) return null;
  const mentores = usuarios.filter((u) => equipe.id_mentores.includes(u.id_usuario)).map(paraPublico);
  return { ...equipe, integrantes: comIntegrantes(idEquipe), mentores };
}

export const equipesService = {
  listar(filtros: FiltrosEquipe) {
    const buscaLower = filtros.busca?.trim().toLowerCase();

    return equipes
      .filter((equipe) => {
        if (filtros.area && equipe.area_ideia !== filtros.area) return false;
        if (filtros.turma && equipe.turma !== filtros.turma) return false;
        if (filtros.idMentor && !equipe.id_mentores.includes(filtros.idMentor)) return false;

        if (filtros.idCurso) {
          const temCurso = comIntegrantes(equipe.id_equipe).some((i) => i.usuario?.id_curso === filtros.idCurso);
          if (!temCurso) return false;
        }

        if (filtros.statusTarefa) {
          const temStatus = tarefas.some((t) => t.id_equipe === equipe.id_equipe && t.status === filtros.statusTarefa);
          if (!temStatus) return false;
        }

        if (buscaLower) {
          const alvo = `${equipe.nome_equipe} ${equipe.nome_ideia}`.toLowerCase();
          if (!alvo.includes(buscaLower)) return false;
        }

        return true;
      })
      .map((equipe) => compor(equipe.id_equipe));
  },

  buscarPorId(idEquipe: number) {
    const equipe = compor(idEquipe);
    if (!equipe) throw ApiError.notFound("Equipe não encontrada.");
    return equipe;
  },

  listarDoMentor(idMentor: number) {
    return equipes.filter((e) => e.id_mentores.includes(idMentor)).map((e) => compor(e.id_equipe));
  },

  listarDoAluno(idUsuario: number) {
    const idsEquipe = equipeUsuarios.filter((eu) => eu.id_usuario === idUsuario).map((eu) => eu.id_equipe);
    return equipes.filter((e) => idsEquipe.includes(e.id_equipe)).map((e) => compor(e.id_equipe));
  },

  ehMentorDaEquipe(idEquipe: number, idUsuario: number): boolean {
    const equipe = equipes.find((e) => e.id_equipe === idEquipe);
    return Boolean(equipe?.id_mentores.includes(idUsuario));
  },

  ehIntegranteDaEquipe(idEquipe: number, idUsuario: number): boolean {
    return equipeUsuarios.some((eu) => eu.id_equipe === idEquipe && eu.id_usuario === idUsuario);
  },

  /** RF-09 — avançar etapa manualmente (admin ou mentor da equipe, ver RN-01). */
  avancarEtapa(idEquipe: number) {
    const equipe = equipes.find((e) => e.id_equipe === idEquipe);
    if (!equipe) throw ApiError.notFound("Equipe não encontrada.");
    if (equipe.id_etapa_atual < etapas.length) {
      equipe.id_etapa_atual += 1;
      historicoEtapas.push({
        id_equipe: idEquipe,
        id_etapa: equipe.id_etapa_atual,
        data_entrada: new Date().toISOString().slice(0, 10),
      });
    }
    return compor(idEquipe);
  },

  retrocederEtapa(idEquipe: number) {
    const equipe = equipes.find((e) => e.id_equipe === idEquipe);
    if (!equipe) throw ApiError.notFound("Equipe não encontrada.");
    if (equipe.id_etapa_atual > 1) {
      equipe.id_etapa_atual -= 1;
    }
    return compor(idEquipe);
  },

  listarHistorico(idEquipe: number) {
    return historicoEtapas.filter((h) => h.id_equipe === idEquipe).sort((a, b) => a.id_etapa - b.id_etapa);
  },
};
