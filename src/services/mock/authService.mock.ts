import { EQUIPES, HISTORICO_ETAPAS, USUARIOS } from "@/mocks/data";
import type { CadastroIdeiaPayload, Equipe, IntegranteEquipe, Usuario } from "@/types";

const ATRASO_MS = 400;

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ATRASO_MS));
}

let proximoIdUsuario = USUARIOS.length + 1;
let proximoIdEquipe = EQUIPES.length + 1;
let proximoIdEquipeUsuario = 1000;

const TURMA_ATUAL = "2026/1";

function encontrarOuCriarUsuario(nome: string, email: string, curso?: string): Usuario {
  const existente = USUARIOS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existente) return existente;
  const novo: Usuario = {
    id_usuario: proximoIdUsuario++,
    nome,
    telefone: "",
    email,
    perfil: "aluno",
    ativo: true,
  };
  void curso;
  USUARIOS.push(novo);
  return novo;
}

export const authServiceMock = {
  async login(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
    const usuario = USUARIOS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!usuario || senha.length < 6) {
      await atraso(null);
      throw new Error("Credenciais inválidas");
    }
    if (usuario.ativo === false) {
      await atraso(null);
      throw new Error("Conta desativada");
    }
    return atraso({ token: `mock-token-${usuario.id_usuario}`, usuario });
  },

  /** RF-02/RF-05 — cria a conta do líder, os integrantes informados (sem exigir RA, só e-mail e curso) e a equipe já na Etapa 1. */
  async cadastrarIdeia(payload: CadastroIdeiaPayload): Promise<{ token: string; usuario: Usuario }> {
    const lider: Usuario = {
      id_usuario: proximoIdUsuario++,
      nome: payload.nome_lider,
      telefone: payload.telefone,
      email: payload.email,
      perfil: "aluno",
      id_curso: payload.id_curso,
      semestre: payload.semestre,
      ativo: true,
    };
    USUARIOS.push(lider);

    const integrantesEquipe: IntegranteEquipe[] = [
      { id_equipe_usuario: proximoIdEquipeUsuario++, id_equipe: proximoIdEquipe, id_usuario: lider.id_usuario, papel: "lider", usuario: lider },
    ];

    for (const integrante of payload.integrantes) {
      const usuarioIntegrante = encontrarOuCriarUsuario(integrante.nome, integrante.email, integrante.curso);
      integrantesEquipe.push({
        id_equipe_usuario: proximoIdEquipeUsuario++,
        id_equipe: proximoIdEquipe,
        id_usuario: usuarioIntegrante.id_usuario,
        papel: "integrante",
        usuario: usuarioIntegrante,
      });
    }

    const novaEquipe: Equipe = {
      id_equipe: proximoIdEquipe,
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
      integrantes: integrantesEquipe,
    };
    EQUIPES.push(novaEquipe);
    HISTORICO_ETAPAS.push({ id_equipe: novaEquipe.id_equipe, id_etapa: 1, data_entrada: new Date().toISOString().slice(0, 10) });
    proximoIdEquipe++;

    return atraso({ token: `mock-token-${lider.id_usuario}`, usuario: lider });
  },

  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    await atraso(null);
    void email; // no mock, apenas simula o envio — sem backend/e-mail real ainda
  },
};

/** Contas de teste exibidas na tela de login em modo mock. */
export const CONTAS_TESTE = [
  { perfil: "Admin", email: "bruna.admin@infohub.edu.br" },
  { perfil: "Mentor", email: "rafael.mentor@infohub.edu.br" },
  { perfil: "Aluno (líder)", email: "gustavo@aluno.edu.br" },
  { perfil: "Aluno (integrante)", email: "larissa@aluno.edu.br" },
] as const;
