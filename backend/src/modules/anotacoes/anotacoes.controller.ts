import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../../db/pool";

const criarAnotacaoSchema = z.object({
  id_etapa: z.number().int().positive(),
  descricao: z.string().min(1, "Escreva a anotação."),
});

export const anotacoesController = {
  // GET /api/equipes/:id/anotacoes — RF-10, nunca exposto ao aluno (ver equipes.routes)
  async listar(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT a.id_anotacao, a.descricao, a.data_registro, a.id_usuario, a.id_equipe, a.id_etapa,
              json_build_object('id_usuario', u.id_usuario, 'nome', u.nome, 'email', u.email, 'perfil', u.perfil) AS autor
       FROM anotacoes a
       JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE a.id_equipe = $1
       ORDER BY a.data_registro DESC`,
      [idEquipe]
    );
    res.json(rows.map((r) => ({ ...r, data_registro: new Date(r.data_registro).toISOString() })));
  },

  async criar(req: Request, res: Response) {
    const idEquipe = Number(req.params.id);
    const { id_etapa, descricao } = criarAnotacaoSchema.parse(req.body);
    const usuario = req.usuario!;

    const { rows } = await pool.query(
      `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa)
       VALUES ($1, $2, $3, $4)
       RETURNING id_anotacao, descricao, data_registro, id_usuario, id_equipe, id_etapa`,
      [descricao, usuario.id_usuario, idEquipe, id_etapa]
    );

    const { rows: autorRows } = await pool.query(
      "SELECT id_usuario, nome, email, perfil FROM usuario WHERE id_usuario = $1",
      [usuario.id_usuario]
    );

    res.status(201).json({
      ...rows[0],
      data_registro: new Date(rows[0].data_registro).toISOString(),
      autor: autorRows[0],
    });
  },
};
