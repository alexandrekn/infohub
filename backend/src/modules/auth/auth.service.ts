import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../../db/pool";
import { ApiError } from "../../utils/ApiError";
import { assinarToken } from "../../utils/jwt";
import { ETAPAS_PADRAO } from "../../constants/etapasPadrao";
import { notificacoesService } from "../../services/email/notificacoes.service";
import type { Usuario, UsuarioPublico } from "../../types";
import type { CadastroIdeiaInput } from "./auth.schema";

const TURMA_ATUAL = "2026/1";

export function paraPublico(usuario: Usuario): UsuarioPublico {
  const { senha_hash, ...publico } = usuario;
  return publico;
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

async function encontrarPorEmail(email: string): Promise<Usuario | undefined> {
  const { rows } = await pool.query("SELECT * FROM usuario WHERE lower(email) = lower($1)", [email]);
  return rows[0] ? linhaParaUsuario(rows[0]) : undefined;
}

async function encontrarOuCriarIntegrante(client: import("pg").PoolClient, nome: string, email: string): Promise<Usuario> {
  const existente = await client.query("SELECT * FROM usuario WHERE lower(email) = lower($1)", [email]);
  if (existente.rows[0]) return linhaParaUsuario(existente.rows[0]);

  // Conta criada automaticamente (RF-02) — o integrante ainda não definiu senha própria;
  // um hash aleatório impede login até o fluxo de "esqueci minha senha" ser usado.
  const senhaTemporariaHash = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 8);
  const { rows } = await client.query(
    `INSERT INTO usuario (nome, telefone, email, senha, perfil, ativo)
     VALUES ($1, '', $2, $3, 'aluno', true) RETURNING *`,
    [nome, email, senhaTemporariaHash]
  );
  return linhaParaUsuario(rows[0]);
}

export const authService = {
  async login(email: string, senha: string) {
    const usuario = await encontrarPorEmail(email);
    if (!usuario) throw ApiError.unauthorized("E-mail ou senha inválidos.");
    if (!usuario.ativo) throw ApiError.forbidden("Esta conta está desativada.");

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) throw ApiError.unauthorized("E-mail ou senha inválidos.");

    const token = assinarToken({ id_usuario: usuario.id_usuario, perfil: usuario.perfil, email: usuario.email });
    return { token, usuario: paraPublico(usuario) };
  },

  /** RF-02/RF-05 — cria o líder, os integrantes (sem RA, só e-mail e curso) e a equipe já na Etapa 1. */
  async cadastrarIdeia(payload: CadastroIdeiaInput) {
    if (await encontrarPorEmail(payload.email)) {
      throw ApiError.conflict("Já existe uma conta com este e-mail.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const senhaHash = await bcrypt.hash(payload.senha, 10);
      const { rows: liderRows } = await client.query(
        `INSERT INTO usuario (nome, telefone, email, senha, perfil, id_curso, semestre, ativo)
         VALUES ($1, $2, $3, $4, 'aluno', $5, $6, true) RETURNING *`,
        [payload.nome_lider, payload.telefone, payload.email, senhaHash, payload.id_curso, payload.semestre]
      );
      const lider = linhaParaUsuario(liderRows[0]);

      const { rows: equipeRows } = await client.query(
        `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, como_conheceu, link_pitch, id_etapa_atual, turma)
         VALUES ($1, $1, $2, $3, $4, $5, NULL, NULL, $6) RETURNING id_equipe`,
        [payload.nome_ideia, payload.descricao_ideia, payload.area_ideia, payload.estagio_ideia, payload.como_conheceu ?? null, TURMA_ATUAL]
      );
      const idEquipe = equipeRows[0].id_equipe as number;

      let primeiraEtapaId: number | null = null;
      for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
        const { rows: etapaRows } = await client.query(
          "INSERT INTO etapa (id_equipe, nome, descricao, ordem) VALUES ($1, $2, $3, $4) RETURNING id_etapa",
          [idEquipe, ETAPAS_PADRAO[i].nome, ETAPAS_PADRAO[i].descricao, i + 1]
        );
        if (i === 0) primeiraEtapaId = etapaRows[0].id_etapa;
      }
      await client.query("UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2", [primeiraEtapaId, idEquipe]);

      await client.query("INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1, $2, 'lider')", [idEquipe, lider.id_usuario]);

      for (const integrante of payload.integrantes) {
        const usuarioIntegrante = await encontrarOuCriarIntegrante(client, integrante.nome, integrante.email);
        await client.query(
          "INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1, $2, 'integrante') ON CONFLICT DO NOTHING",
          [idEquipe, usuarioIntegrante.id_usuario]
        );
      }

      await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa) VALUES ($1, $2)", [idEquipe, primeiraEtapaId]);

      await client.query("COMMIT");

      // Fora da transação: se o e-mail falhar, não deve desfazer o cadastro já confirmado.
      void notificacoesService.novoCadastro(lider.nome, payload.nome_ideia);

      const token = assinarToken({ id_usuario: lider.id_usuario, perfil: lider.perfil, email: lider.email });
      return { token, usuario: paraPublico(lider) };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async solicitarRecuperacaoSenha(email: string) {
    // Sem envio real de e-mail ainda (depende do Resend — RF-17/18/19).
    // Resposta é sempre "ok" independentemente de o e-mail existir, para não vazar quais contas existem.
    void (await encontrarPorEmail(email));
  },
};
