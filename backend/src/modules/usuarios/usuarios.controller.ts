import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response } from "express";
import { pool } from "../../db/pool";
import { ApiError } from "../../utils/ApiError";
import { criarUsuarioSchema } from "./usuarios.schema";
import type { PerfilUsuario } from "../../types";

function semSenha(row: any) {
  const { senha, ...resto } = row;
  return resto;
}

export const usuariosController = {
  // GET /api/usuarios?perfil=admin,mentor — RF-03
  async listar(req: Request, res: Response) {
    const perfis = (typeof req.query.perfil === "string" ? req.query.perfil.split(",") : ["admin", "mentor"]) as PerfilUsuario[];
    const { rows } = await pool.query("SELECT * FROM usuario WHERE perfil = ANY($1) ORDER BY nome", [perfis]);
    res.json(rows.map(semSenha));
  },

  // POST /api/usuarios — RF-03
  async criar(req: Request, res: Response) {
    const dados = criarUsuarioSchema.parse(req.body);

    const { rows: existentes } = await pool.query("SELECT 1 FROM usuario WHERE lower(email) = lower($1)", [dados.email]);
    if (existentes.length > 0) {
      throw ApiError.conflict("Já existe uma conta com este e-mail.");
    }

    // Conta criada pelo admin ainda não tem senha própria — fica inutilizável até o
    // fluxo de "esqueci minha senha" (ou um convite por e-mail) ser implementado.
    const senhaTemporariaHash = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 8);
    const { rows } = await pool.query(
      `INSERT INTO usuario (nome, telefone, email, senha, perfil, ativo)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [dados.nome, dados.telefone, dados.email, senhaTemporariaHash, dados.perfil]
    );
    res.status(201).json(semSenha(rows[0]));
  },

  // PATCH /api/usuarios/:id/alternar-ativo — RF-03
  async alternarAtivo(req: Request, res: Response) {
    const idUsuario = Number(req.params.id);
    const { rows } = await pool.query(
      "UPDATE usuario SET ativo = NOT ativo WHERE id_usuario = $1 RETURNING *",
      [idUsuario]
    );
    if (!rows[0]) throw ApiError.notFound("Usuário não encontrado.");
    res.json(semSenha(rows[0]));
  },
};
