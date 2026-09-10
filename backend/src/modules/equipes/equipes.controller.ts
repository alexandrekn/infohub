import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { equipesService } from "./equipes.service";
import type { AreaIdeia, StatusTarefa } from "../../types";

function paraNumeroOuUndefined(valor: unknown): number | undefined {
  if (typeof valor !== "string" || valor.trim() === "") return undefined;
  const numero = Number(valor);
  return Number.isNaN(numero) ? undefined : numero;
}

export const equipesController = {
  // RF-06/RF-07 — kanban com busca e filtros (admin).
  async listar(req: Request, res: Response) {
    const equipes = equipesService.listar({
      busca: typeof req.query.busca === "string" ? req.query.busca : undefined,
      area: req.query.area as AreaIdeia | undefined,
      turma: typeof req.query.turma === "string" ? req.query.turma : undefined,
      idMentor: paraNumeroOuUndefined(req.query.idMentor),
      idCurso: paraNumeroOuUndefined(req.query.idCurso),
      statusTarefa: req.query.statusTarefa as StatusTarefa | undefined,
    });
    res.json(equipes);
  },

  // Equipes do usuário logado — aluno vê as suas, mentor vê as que mentora.
  async minhas(req: Request, res: Response) {
    const usuario = req.usuario!;
    if (usuario.perfil === "mentor") {
      return res.json(equipesService.listarDoMentor(usuario.id_usuario));
    }
    if (usuario.perfil === "aluno") {
      return res.json(equipesService.listarDoAluno(usuario.id_usuario));
    }
    throw ApiError.badRequest("Administradores devem usar a listagem geral (/api/equipes).");
  },

  // RF-08 — detalhe da equipe. Aluno só pode ver a própria; mentor só a que mentora.
  async buscarPorId(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const usuario = req.usuario!;

    if (usuario.perfil === "aluno" && !equipesService.ehIntegranteDaEquipe(idEquipe, usuario.id_usuario)) {
      throw ApiError.forbidden("Você não faz parte desta equipe.");
    }
    if (usuario.perfil === "mentor" && !equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario)) {
      throw ApiError.forbidden("Você não mentora esta equipe.");
    }

    res.json(equipesService.buscarPorId(idEquipe));
  },

  // RF-09 — avançar/retroceder etapa (admin ou mentor da equipe — RN-01).
  async avancarEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    exigirGerenciador(req, idEquipe);
    res.json(equipesService.avancarEtapa(idEquipe));
  },

  async retrocederEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    exigirGerenciador(req, idEquipe);
    res.json(equipesService.retrocederEtapa(idEquipe));
  },

  async historico(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    res.json(equipesService.listarHistorico(idEquipe));
  },
};

/** Admin sempre pode; mentor só se mentora a equipe em questão. */
export function exigirGerenciador(req: Request, idEquipe: number) {
  const usuario = req.usuario!;
  if (usuario.perfil === "admin") return;
  if (usuario.perfil === "mentor" && equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario)) return;
  throw ApiError.forbidden();
}
