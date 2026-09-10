import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response } from "express";
import { contadores, usuarios } from "../../data/store";
import { ApiError } from "../../utils/ApiError";
import { paraPublico } from "../auth/auth.service";
import { criarUsuarioSchema } from "./usuarios.schema";
import type { PerfilUsuario, Usuario } from "../../types";

export const usuariosController = {
  // GET /api/usuarios?perfil=admin,mentor — RF-03
  async listar(req: Request, res: Response) {
    const perfisParam = typeof req.query.perfil === "string" ? req.query.perfil.split(",") : ["admin", "mentor"];
    const perfis = perfisParam as PerfilUsuario[];
    const lista = usuarios.filter((u) => perfis.includes(u.perfil)).map(paraPublico);
    res.json(lista);
  },

  // POST /api/usuarios — RF-03
  async criar(req: Request, res: Response) {
    const dados = criarUsuarioSchema.parse(req.body);

    if (usuarios.some((u) => u.email.toLowerCase() === dados.email.toLowerCase())) {
      throw ApiError.conflict("Já existe uma conta com este e-mail.");
    }

    // Conta criada pelo admin ainda não tem senha própria — fica inutilizável até o
    // fluxo de "esqueci minha senha" (ou um convite por e-mail) ser implementado.
    const senhaTemporariaHash = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 8);
    const novo: Usuario = {
      id_usuario: contadores.usuario++,
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      perfil: dados.perfil,
      senha_hash: senhaTemporariaHash,
      ativo: true,
    };
    usuarios.push(novo);
    res.status(201).json(paraPublico(novo));
  },

  // PATCH /api/usuarios/:id/alternar-ativo — RF-03
  async alternarAtivo(req: Request, res: Response) {
    const idUsuario = Number(req.params.id);
    const usuario = usuarios.find((u) => u.id_usuario === idUsuario);
    if (!usuario) throw ApiError.notFound("Usuário não encontrado.");

    usuario.ativo = !usuario.ativo;
    res.json(paraPublico(usuario));
  },
};
