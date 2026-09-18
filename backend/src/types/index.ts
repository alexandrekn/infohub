export type PerfilUsuario = "aluno" | "mentor" | "admin";
export type PapelEquipe = "lider" | "integrante";

export type AreaIdeia =
  | "Saúde"
  | "Educação"
  | "Meio Ambiente"
  | "Tecnologia"
  | "Entretenimento"
  | "Serviços"
  | "Outro";

export type EstagioIdeia = "Apenas ideia" | "Validação" | "Prototipagem" | "Lançamento";

export type ComoConheceu = "Redes sociais" | "Amigos" | "Eventos" | "Outros";

export type StatusTarefa =
  | "Pendente"
  | "Em andamento"
  | "Entregue"
  | "Atrasada"
  | "Aprovada"
  | "Reprovada/Ajustar";

export interface Curso {
  id_curso: number;
  nome: string;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  telefone: string;
  email: string;
  senha_hash: string;
  perfil: PerfilUsuario;
  id_curso?: number | null;
  semestre?: number | null;
  ativo: boolean;
}

/** Usuario sem o hash de senha — o que a API expõe. */
export type UsuarioPublico = Omit<Usuario, "senha_hash">;

export interface Etapa {
  id_etapa: number;
  id_equipe: number;
  nome: string;
  descricao: string;
  ordem: number;
}

export interface IntegranteEquipe {
  id_equipe_usuario: number;
  id_equipe: number;
  id_usuario: number;
  papel: PapelEquipe;
}

export interface Equipe {
  id_equipe: number;
  nome_equipe: string;
  nome_ideia: string;
  descricao_ideia: string;
  area_ideia: AreaIdeia;
  estagio_ideia: EstagioIdeia;
  como_conheceu?: ComoConheceu | null;
  link_pitch?: string | null;
  /** Muitos-para-muitos — quando o Prisma entrar, isso vira a tabela equipe_mentor. */
  id_mentores: number[];
  id_etapa_atual: number;
  turma: string;
}

export interface Tarefa {
  id_tarefa: number;
  titulo: string;
  descricao: string;
  data_limite: string;
  id_equipe: number;
  id_etapa: number;
  status: StatusTarefa;
}

export interface Entregavel {
  id_entregavel: number;
  arquivo_url: string;
  tipo?: string | null;
  data_envio: string;
  id_tarefa: number;
  id_usuario: number;
  versao: number;
}

export interface Anotacao {
  id_anotacao: number;
  descricao: string;
  data_registro: string;
  id_usuario: number;
  id_equipe: number;
  id_etapa: number;
}

export interface Lembrete {
  id_lembrete: number;
  data_programada: string;
  enviado: boolean;
  id_tarefa: number;
}

export interface HistoricoEtapa {
  id_equipe: number;
  id_etapa: number;
  data_entrada: string;
}

/** Payload do formulário inicial (Etapa 1 — Envio da ideia). */
export interface IntegranteFormulario {
  nome: string;
  email: string;
  curso: string;
}

export interface CadastroIdeiaPayload {
  nome_lider: string;
  email: string;
  telefone: string;
  senha: string;
  id_curso: number;
  semestre: number;
  integrantes: IntegranteFormulario[];
  nome_ideia: string;
  descricao_ideia: string;
  area_ideia: AreaIdeia;
  estagio_ideia: EstagioIdeia;
  como_conheceu?: ComoConheceu;
}

/** O que carregamos no JWT e disponibilizamos em req.usuario. */
export interface UsuarioAutenticado {
  id_usuario: number;
  perfil: PerfilUsuario;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
