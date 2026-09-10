import bcrypt from "bcryptjs";
import type {
  Anotacao,
  Curso,
  Entregavel,
  Equipe,
  Etapa,
  HistoricoEtapa,
  IntegranteEquipe,
  Lembrete,
  Tarefa,
  Usuario,
} from "../types";

/**
 * Camada de dados 100% em memória.
 *
 * Quando o Prisma + MySQL entrarem em uso, cada array aqui vira uma tabela
 * real (o nome dos campos já foi escolhido para bater com banco.sql) e as
 * funções em modules/&#42;/&#42;.service.ts trocam de "mexer no array" para
 * "chamar prisma.<model>.<metodo>". As rotas e controllers não precisam mudar.
 */

const SENHA_PADRAO_HASH = bcrypt.hashSync("senha123", 8);

export const cursos: Curso[] = [
  "Sistemas de Informação",
  "Direito",
  "Administração",
  "Gastronomia",
  "Ciências Contábeis",
  "Ontopsicologia",
  "Hotelaria",
  "Pedagogia",
].map((nome, index) => ({ id_curso: index + 1, nome }));

export const etapas: Etapa[] = [
  { id_etapa: 1, nome: "Envio da ideia", descricao: "Aluno preenche o formulário inicial contando a ideia." },
  { id_etapa: 2, nome: "Contato com a equipe", descricao: "Equipe InfoHub analisa a proposta e agenda o 1º encontro." },
  { id_etapa: 3, nome: "Encontro 1 — Entendendo a ideia", descricao: "Problema, público-alvo e solução inicial." },
  { id_etapa: 4, nome: "Encontro 2 — Proposta de valor", descricao: "Construção do Value Proposition Design." },
  { id_etapa: 5, nome: "Encontro 3 — Modelo de negócio", descricao: "Construção do Business Model Canvas." },
  { id_etapa: 6, nome: "Encontro 4 — Pitch e inscrição", descricao: "Revisão geral, Pitch Vídeo e conferência de documentos." },
];

export const usuarios: Usuario[] = [
  { id_usuario: 1, nome: "Bruna Nunes", telefone: "55999990001", email: "bruna.admin@infohub.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "admin", ativo: true },
  { id_usuario: 2, nome: "Rafael Costa", telefone: "55999990002", email: "rafael.mentor@infohub.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "mentor", ativo: true },
  { id_usuario: 3, nome: "Camila Fagundes", telefone: "55999990003", email: "camila.mentor@infohub.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "mentor", ativo: true },
  { id_usuario: 4, nome: "Gustavo Martins", telefone: "55999990004", email: "gustavo@aluno.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "aluno", id_curso: 1, semestre: 5, ativo: true },
  { id_usuario: 5, nome: "Larissa Prado", telefone: "55999990005", email: "larissa@aluno.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "aluno", id_curso: 1, semestre: 5, ativo: true },
  { id_usuario: 6, nome: "Diego Almeida", telefone: "55999990006", email: "diego@aluno.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "aluno", id_curso: 3, semestre: 3, ativo: true },
  { id_usuario: 7, nome: "Fernanda Reis", telefone: "55999990007", email: "fernanda@aluno.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "aluno", id_curso: 4, semestre: 7, ativo: true },
  { id_usuario: 8, nome: "Otávio Lima", telefone: "55999990008", email: "otavio@aluno.edu.br", senha_hash: SENHA_PADRAO_HASH, perfil: "aluno", id_curso: 6, semestre: 2, ativo: true },
];

export const equipes: Equipe[] = [
  {
    id_equipe: 1,
    nome_equipe: "NutriRota",
    nome_ideia: "Roteirizador de refeições para restaurantes universitários",
    descricao_ideia: "App que sugere cardápios balanceados a partir do estoque do RU.",
    area_ideia: "Saúde",
    estagio_ideia: "Prototipagem",
    link_pitch: null,
    id_mentores: [2],
    id_etapa_atual: 5,
    turma: "2026/1",
  },
  {
    id_equipe: 2,
    nome_equipe: "Oficina Viva",
    nome_ideia: "Marketplace de peças recondicionadas para oficinas mecânicas",
    descricao_ideia: "Conecta oficinas com estoque parado a mecânicos que precisam de peças usadas.",
    area_ideia: "Serviços",
    estagio_ideia: "Validação",
    link_pitch: null,
    id_mentores: [3],
    id_etapa_atual: 3,
    turma: "2026/1",
  },
  {
    id_equipe: 3,
    nome_equipe: "Raízes",
    nome_ideia: "Plataforma de hospedagem em pousadas rurais da região",
    descricao_ideia: "Divulga pousadas familiares que não têm presença digital hoje.",
    area_ideia: "Entretenimento",
    estagio_ideia: "Lançamento",
    link_pitch: "https://youtube.com/watch?v=exemplo-raizes",
    id_mentores: [2, 3],
    id_etapa_atual: 6,
    turma: "2025/2",
  },
  {
    id_equipe: 4,
    nome_equipe: "EduPasso",
    nome_ideia: "Trilhas de reforço escolar gamificadas",
    descricao_ideia: "Ainda em fase de esboço, sem validação com professores.",
    area_ideia: "Educação",
    estagio_ideia: "Apenas ideia",
    link_pitch: null,
    id_mentores: [],
    id_etapa_atual: 1,
    turma: "2026/1",
  },
];

export const equipeUsuarios: IntegranteEquipe[] = [
  { id_equipe_usuario: 1, id_equipe: 1, id_usuario: 4, papel: "lider" },
  { id_equipe_usuario: 2, id_equipe: 1, id_usuario: 5, papel: "integrante" },
  { id_equipe_usuario: 3, id_equipe: 2, id_usuario: 6, papel: "lider" },
  { id_equipe_usuario: 4, id_equipe: 3, id_usuario: 7, papel: "lider" },
  { id_equipe_usuario: 5, id_equipe: 4, id_usuario: 8, papel: "lider" },
];

export const tarefas: Tarefa[] = [
  { id_tarefa: 1, titulo: "Definir problema e público-alvo", descricao: "Documento com problema, persona e hipótese de solução.", data_limite: "2026-08-18", id_equipe: 1, id_etapa: 3, status: "Aprovada" },
  { id_tarefa: 2, titulo: "Enviar Value Proposition Design", descricao: "Canvas de proposta de valor preenchido.", data_limite: "2026-08-25", id_equipe: 1, id_etapa: 4, status: "Aprovada" },
  { id_tarefa: 3, titulo: "Enviar Business Model Canvas", descricao: "Canvas de modelo de negócio completo.", data_limite: "2026-09-02", id_equipe: 1, id_etapa: 5, status: "Em andamento" },
  { id_tarefa: 4, titulo: "Definir problema e público-alvo", descricao: "Documento com problema, persona e hipótese de solução.", data_limite: "2026-08-29", id_equipe: 2, id_etapa: 3, status: "Reprovada/Ajustar" },
  { id_tarefa: 5, titulo: "Gravar Pitch Vídeo", descricao: "Link do YouTube com até 3 minutos.", data_limite: "2026-08-15", id_equipe: 3, id_etapa: 6, status: "Aprovada" },
  { id_tarefa: 6, titulo: "Conferir dados de todos os integrantes", descricao: "Confirmar e-mail e curso de cada integrante.", data_limite: "2026-08-14", id_equipe: 3, id_etapa: 6, status: "Aprovada" },
  { id_tarefa: 7, titulo: "Enviar Business Model Canvas", descricao: "Canvas de modelo de negócio completo.", data_limite: "2026-08-20", id_equipe: 2, id_etapa: 5, status: "Atrasada" },
];

export const entregaveis: Entregavel[] = [
  { id_entregavel: 1, arquivo_url: "https://drive.google.com/vpd-nutrirota-v1", tipo: "PDF", data_envio: "2026-08-24T14:00:00", id_tarefa: 2, id_usuario: 4, versao: 1 },
  { id_entregavel: 2, arquivo_url: "https://drive.google.com/vpd-nutrirota-v2", tipo: "PDF", data_envio: "2026-08-25T09:00:00", id_tarefa: 2, id_usuario: 4, versao: 2 },
  { id_entregavel: 3, arquivo_url: "https://youtube.com/watch?v=exemplo-raizes", tipo: "Link", data_envio: "2026-08-14T11:00:00", id_tarefa: 5, id_usuario: 7, versao: 1 },
];

export const anotacoes: Anotacao[] = [
  { id_anotacao: 1, descricao: "Equipe animada, mas precisa amadurecer a persona antes do próximo encontro.", data_registro: "2026-08-10T10:00:00", id_usuario: 2, id_equipe: 1, id_etapa: 3 },
  { id_anotacao: 2, descricao: "Reforçar a diferenciação frente aos concorrentes no VPD.", data_registro: "2026-08-24T15:00:00", id_usuario: 2, id_equipe: 1, id_etapa: 4 },
];

export const lembretes: Lembrete[] = [
  { id_lembrete: 1, data_programada: "2026-08-30", enviado: false, id_tarefa: 3 },
  { id_lembrete: 2, data_programada: "2026-09-01", enviado: false, id_tarefa: 3 },
  { id_lembrete: 3, data_programada: "2026-08-17", enviado: true, id_tarefa: 5 },
];

export const historicoEtapas: HistoricoEtapa[] = [
  { id_equipe: 1, id_etapa: 1, data_entrada: "2026-07-01" },
  { id_equipe: 1, id_etapa: 2, data_entrada: "2026-07-05" },
  { id_equipe: 1, id_etapa: 3, data_entrada: "2026-07-14" },
  { id_equipe: 1, id_etapa: 4, data_entrada: "2026-07-28" },
  { id_equipe: 1, id_etapa: 5, data_entrada: "2026-08-11" },
  { id_equipe: 2, id_etapa: 1, data_entrada: "2026-07-03" },
  { id_equipe: 2, id_etapa: 2, data_entrada: "2026-07-09" },
  { id_equipe: 2, id_etapa: 3, data_entrada: "2026-07-20" },
  { id_equipe: 3, id_etapa: 1, data_entrada: "2026-02-02" },
  { id_equipe: 3, id_etapa: 2, data_entrada: "2026-02-09" },
  { id_equipe: 3, id_etapa: 3, data_entrada: "2026-02-20" },
  { id_equipe: 3, id_etapa: 4, data_entrada: "2026-03-05" },
  { id_equipe: 3, id_etapa: 5, data_entrada: "2026-03-19" },
  { id_equipe: 3, id_etapa: 6, data_entrada: "2026-04-02" },
  { id_equipe: 4, id_etapa: 1, data_entrada: "2026-08-20" },
];

/** Modelos de tarefa pré-configurados por etapa (RF-11). */
export const modelosTarefaPorEtapa: Record<number, { titulo: string; descricao: string }[]> = {
  3: [{ titulo: "Definir problema e público-alvo", descricao: "Documento com problema, persona e hipótese de solução." }],
  4: [{ titulo: "Enviar Value Proposition Design", descricao: "Canvas de proposta de valor preenchido." }],
  5: [{ titulo: "Enviar Business Model Canvas", descricao: "Canvas de modelo de negócio completo." }],
  6: [
    { titulo: "Gravar Pitch Vídeo", descricao: "Link do YouTube com até 3 minutos." },
    { titulo: "Conferir dados de todos os integrantes", descricao: "Confirmar e-mail e curso de cada integrante." },
  ],
};

// Contadores para gerar próximos IDs (trocar por auto-incremento do banco quando o Prisma entrar).
export const contadores = {
  usuario: usuarios.length + 1,
  equipe: equipes.length + 1,
  equipeUsuario: equipeUsuarios.length + 1,
  tarefa: tarefas.length + 1,
  entregavel: entregaveis.length + 1,
  anotacao: anotacoes.length + 1,
  lembrete: lembretes.length + 1,
};
