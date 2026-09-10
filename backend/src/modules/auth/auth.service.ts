import bcrypt from "bcryptjs";
import crypto from "crypto";
import { contadores, equipeUsuarios, equipes, historicoEtapas, usuarios } from "../../data/store";
import { ApiError } from "../../utils/ApiError";
import { assinarToken } from "../../utils/jwt";
import type { Usuario, UsuarioPublico } from "../../types";
import type { CadastroIdeiaInput } from "./auth.schema";

const TURMA_ATUAL = "2026/1";

export function paraPublico(usuario: Usuario): UsuarioPublico {
  const { senha_hash, ...publico } = usuario;
  return publico;
}

function encontrarPorEmail(email: string): Usuario | undefined {
  return usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function encontrarOuCriarIntegrante(nome: string, email: string): Usuario {
  const existente = encontrarPorEmail(email);
  if (existente) return existente;

  // Conta criada automaticamente (RF-02) — o integrante ainda não definiu senha própria;
  // um hash aleatório impede login até o fluxo de "esqueci minha senha" ser usado.
  const senhaTemporariaHash = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 8);
  const novo: Usuario = {
    id_usuario: contadores.usuario++,
    nome,
    telefone: "",
    email,
    senha_hash: senhaTemporariaHash,
    perfil: "aluno",
    ativo: true,
  };
  usuarios.push(novo);
  return novo;
}

export const authService = {
  async login(email: string, senha: string) {
    const usuario = encontrarPorEmail(email);
    if (!usuario) throw ApiError.unauthorized("E-mail ou senha inválidos.");
    if (!usuario.ativo) throw ApiError.forbidden("Esta conta está desativada.");

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) throw ApiError.unauthorized("E-mail ou senha inválidos.");

    const token = assinarToken({ id_usuario: usuario.id_usuario, perfil: usuario.perfil, email: usuario.email });
    return { token, usuario: paraPublico(usuario) };
  },

  /** RF-02/RF-05 — cria o líder, os integrantes (sem RA, só e-mail e curso) e a equipe já na Etapa 1. */
  async cadastrarIdeia(payload: CadastroIdeiaInput) {
    if (encontrarPorEmail(payload.email)) {
      throw ApiError.conflict("Já existe uma conta com este e-mail.");
    }

    const senhaHash = await bcrypt.hash(payload.senha, 10);
    const lider: Usuario = {
      id_usuario: contadores.usuario++,
      nome: payload.nome_lider,
      telefone: payload.telefone,
      email: payload.email,
      senha_hash: senhaHash,
      perfil: "aluno",
      id_curso: payload.id_curso,
      semestre: payload.semestre,
      ativo: true,
    };
    usuarios.push(lider);

    const idEquipe = contadores.equipe++;
    equipeUsuarios.push({ id_equipe_usuario: contadores.equipeUsuario++, id_equipe: idEquipe, id_usuario: lider.id_usuario, papel: "lider" });

    for (const integrante of payload.integrantes) {
      const usuarioIntegrante = encontrarOuCriarIntegrante(integrante.nome, integrante.email);
      equipeUsuarios.push({
        id_equipe_usuario: contadores.equipeUsuario++,
        id_equipe: idEquipe,
        id_usuario: usuarioIntegrante.id_usuario,
        papel: "integrante",
      });
    }

    equipes.push({
      id_equipe: idEquipe,
      nome_equipe: payload.nome_ideia,
      nome_ideia: payload.nome_ideia,
      descricao_ideia: payload.descricao_ideia,
      area_ideia: payload.area_ideia,
      estagio_ideia: payload.estagio_ideia,
      como_conheceu: payload.como_conheceu,
      link_pitch: null,
      id_mentores: [],
      id_etapa_atual: 1,
      turma: TURMA_ATUAL,
    });
    historicoEtapas.push({ id_equipe: idEquipe, id_etapa: 1, data_entrada: new Date().toISOString().slice(0, 10) });

    const token = assinarToken({ id_usuario: lider.id_usuario, perfil: lider.perfil, email: lider.email });
    return { token, usuario: paraPublico(lider) };
  },

  async solicitarRecuperacaoSenha(email: string) {
    // Sem envio real de e-mail ainda (depende do Resend — RF-17/18/19).
    // Resposta é sempre "ok" independentemente de o e-mail existir, para não vazar quais contas existem.
    void encontrarPorEmail(email);
  },
};
