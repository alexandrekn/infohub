import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { tarefasService } from "./tarefas.service";
import { equipesService } from "../equipes/equipes.service";
import { criarTarefaSchema, reprovarTarefaSchema, alterarPrazoSchema, anexarEntregaSchema } from "./tarefas.schema";

function podeGerenciarEquipe(req: Request, idEquipe: number): boolean {
  const usuario = req.usuario!;
  if (usuario.perfil === "admin") return true;
  return usuario.perfil === "mentor" && equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario);
}

export const tarefasController = {
  // GET /api/equipes/:id/tarefas
  async listarPorEquipe(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const usuario = req.usuario!;

    if (usuario.perfil === "aluno" && !equipesService.ehIntegranteDaEquipe(idEquipe, usuario.id_usuario)) {
      throw ApiError.forbidden("Você não faz parte desta equipe.");
    }
    if (usuario.perfil === "mentor" && !equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario)) {
      throw ApiError.forbidden("Você não mentora esta equipe.");
    }

    res.json(tarefasService.listarPorEquipe(idEquipe));
  },

  // GET /api/tarefas (admin — visão geral para RF-07/RF-22)
  async listarTodas(_req: Request, res: Response) {
    res.json(tarefasService.listarTodas());
  },

  // POST /api/equipes/:id/tarefas — RF-11
  async criar(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    if (!podeGerenciarEquipe(req, idEquipe)) throw ApiError.forbidden();

    const dados = criarTarefaSchema.parse(req.body);
    const tarefa = tarefasService.criar(idEquipe, dados);
    res.status(201).json(tarefa);
  },

  // PATCH /api/tarefas/:id/aprovar — RF-15
  async aprovar(req: Request, res: Response) {
    const idTarefa = Number(req.params.id);
    const tarefa = tarefasService.buscarPorId(idTarefa);
    if (!podeGerenciarEquipe(req, tarefa.id_equipe)) throw ApiError.forbidden();

    res.json(tarefasService.aprovar(idTarefa));
  },

  // PATCH /api/tarefas/:id/reprovar — RF-15
  async reprovar(req: Request, res: Response) {
    const idTarefa = Number(req.params.id);
    const tarefa = tarefasService.buscarPorId(idTarefa);
    if (!podeGerenciarEquipe(req, tarefa.id_equipe)) throw ApiError.forbidden();

    const { comentario } = reprovarTarefaSchema.parse(req.body);
    const usuario = req.usuario!;
    res.json(
      tarefasService.reprovar(idTarefa, comentario, {
        idEquipe: tarefa.id_equipe,
        idEtapa: tarefa.id_etapa,
        idUsuario: usuario.id_usuario,
      })
    );
  },

  // PATCH /api/tarefas/:id/prazo — restrito ao mentor da equipe (decisão da equipe de dev)
  async alterarPrazo(req: Request, res: Response) {
    const idTarefa = Number(req.params.id);
    const tarefa = tarefasService.buscarPorId(idTarefa);
    const usuario = req.usuario!;

    const ehMentorDaEquipe = usuario.perfil === "mentor" && equipesService.ehMentorDaEquipe(tarefa.id_equipe, usuario.id_usuario);
    if (!ehMentorDaEquipe) {
      throw ApiError.forbidden("Só o mentor da equipe pode alterar o prazo de uma tarefa.");
    }

    const { data_limite } = alterarPrazoSchema.parse(req.body);
    res.json(tarefasService.alterarPrazo(idTarefa, data_limite));
  },

  // GET /api/tarefas/:id/entregaveis — RF-16
  async listarEntregaveis(req: Request, res: Response) {
    const idTarefa = Number(req.params.id);
    res.json(tarefasService.listarEntregaveis(idTarefa));
  },

  // POST /api/tarefas/:id/entregaveis — RF-14 (só integrante da equipe)
  async anexarEntrega(req: Request, res: Response) {
    const idTarefa = Number(req.params.id);
    const tarefa = tarefasService.buscarPorId(idTarefa);
    const usuario = req.usuario!;

    if (usuario.perfil !== "aluno" || !equipesService.ehIntegranteDaEquipe(tarefa.id_equipe, usuario.id_usuario)) {
      throw ApiError.forbidden("Só integrantes da equipe podem enviar entregas.");
    }

    const { arquivo_url, tipo } = anexarEntregaSchema.parse(req.body);
    const entrega = tarefasService.anexarEntrega(idTarefa, usuario.id_usuario, arquivo_url, tipo);
    res.status(201).json(entrega);
  },
};
