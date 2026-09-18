import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError";
import { equipesService } from "./equipes.service";
import { notificacoesService } from "../../services/email/notificacoes.service";
import { pool } from "../../db/pool";
import type { AreaIdeia, StatusTarefa } from "../../types";

const criarEtapaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da etapa."),
  descricao: z.string().default(""),
});

const lembreteManualSchema = z.object({
  mensagem: z.string().default(""),
});

function paraNumeroOuUndefined(valor: unknown): number | undefined {
  if (typeof valor !== "string" || valor.trim() === "") return undefined;
  const numero = Number(valor);
  return Number.isNaN(numero) ? undefined : numero;
}

export const equipesController = {
  // RF-06/RF-07 — kanban com busca e filtros (admin).
  async listar(req: Request, res: Response) {
    const equipes = await equipesService.listar({
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
      return res.json(await equipesService.listarDoMentor(usuario.id_usuario));
    }
    if (usuario.perfil === "aluno") {
      return res.json(await equipesService.listarDoAluno(usuario.id_usuario));
    }
    throw ApiError.badRequest("Administradores devem usar a listagem geral (/api/equipes).");
  },

  // RF-08 — detalhe da equipe. Aluno só pode ver a própria; mentor só a que mentora.
  async buscarPorId(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const usuario = req.usuario!;

    if (usuario.perfil === "aluno" && !(await equipesService.ehIntegranteDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não faz parte desta equipe.");
    }
    if (usuario.perfil === "mentor" && !(await equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não mentora esta equipe.");
    }

    res.json(await equipesService.buscarPorId(idEquipe));
  },

  // RF-09 — avançar/retroceder etapa (admin ou mentor da equipe — RN-01).
  async avancarEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    await exigirGerenciador(req, idEquipe);
    res.json(await equipesService.avancarEtapa(idEquipe));
  },

  async retrocederEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    await exigirGerenciador(req, idEquipe);
    res.json(await equipesService.retrocederEtapa(idEquipe));
  },

  async historico(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const usuario = req.usuario!;

    if (usuario.perfil === "aluno" && !(await equipesService.ehIntegranteDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não faz parte desta equipe.");
    }
    if (usuario.perfil === "mentor" && !(await equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não mentora esta equipe.");
    }

    res.json(await equipesService.listarHistorico(idEquipe));
  },

  // Etapas da equipe — padrão 6, mas o mentor pode acrescentar ou remover por equipe.
  async listarEtapas(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const usuario = req.usuario!;

    if (usuario.perfil === "aluno" && !(await equipesService.ehIntegranteDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não faz parte desta equipe.");
    }
    if (usuario.perfil === "mentor" && !(await equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario))) {
      throw ApiError.forbidden("Você não mentora esta equipe.");
    }

    res.json(await equipesService.listarEtapas(idEquipe));
  },

  async adicionarEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    await exigirGerenciador(req, idEquipe);

    const { nome, descricao } = criarEtapaSchema.parse(req.body);
    res.status(201).json(await equipesService.adicionarEtapa(idEquipe, nome, descricao));
  },

  async removerEtapa(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const idEtapa = Number(req.params.idEtapa);
    await exigirGerenciador(req, idEquipe);

    res.json(await equipesService.removerEtapa(idEquipe, idEtapa));
  },

  // RF-20 — admin dispara um lembrete manual avulso para uma equipe específica.
  async lembreteManual(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    await exigirGerenciador(req, idEquipe);

    const { mensagem } = lembreteManualSchema.parse(req.body);
    const { rows } = await pool.query("SELECT nome_equipe FROM equipe WHERE id_equipe = $1", [idEquipe]);
    if (!rows[0]) throw ApiError.notFound("Equipe não encontrada.");

    await notificacoesService.lembreteManual(idEquipe, rows[0].nome_equipe, mensagem);
    res.status(204).send();
  },
};

/** Admin sempre pode; mentor só se mentora a equipe em questão. */
export async function exigirGerenciador(req: Request, idEquipe: number) {
  const usuario = req.usuario!;
  if (usuario.perfil === "admin") return;
  if (usuario.perfil === "mentor" && (await equipesService.ehMentorDaEquipe(idEquipe, usuario.id_usuario))) return;
  throw ApiError.forbidden();
}
