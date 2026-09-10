import type { Request, Response } from "express";
import { z } from "zod";
import { anotacoes, contadores, usuarios } from "../../data/store";
import { paraPublico } from "../auth/auth.service";

const criarAnotacaoSchema = z.object({
  id_etapa: z.number().int().positive(),
  descricao: z.string().min(1, "Escreva a anotação."),
});

export const anotacoesController = {
  // GET /api/equipes/:id/anotacoes — RF-10, nunca exposto ao aluno (ver equipes.routes)
  async listar(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const lista = anotacoes
      .filter((a) => a.id_equipe === idEquipe)
      .sort((a, b) => b.data_registro.localeCompare(a.data_registro))
      .map((a) => {
        const autor = usuarios.find((u) => u.id_usuario === a.id_usuario);
        return { ...a, autor: autor ? paraPublico(autor) : null };
      });
    res.json(lista);
  },

  async criar(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const { id_etapa, descricao } = criarAnotacaoSchema.parse(req.body);
    const usuario = req.usuario!;

    const nova = {
      id_anotacao: contadores.anotacao++,
      descricao,
      data_registro: new Date().toISOString(),
      id_usuario: usuario.id_usuario,
      id_equipe: idEquipe,
      id_etapa,
    };
    anotacoes.push(nova);

    const autor = usuarios.find((u) => u.id_usuario === usuario.id_usuario);
    res.status(201).json({ ...nova, autor: autor ? paraPublico(autor) : null });
  },
};
