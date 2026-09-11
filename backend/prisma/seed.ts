import bcrypt from "bcryptjs";
import { pool } from "../src/db/pool";

const CURSOS = [
  "Sistemas de Informação",
  "Direito",
  "Administração",
  "Gastronomia",
  "Ciências Contábeis",
  "Ontopsicologia",
  "Hotelaria",
  "Pedagogia",
];

const ETAPAS = [
  { nome: "Envio da ideia", descricao: "Aluno preenche o formulário inicial contando a ideia." },
  { nome: "Contato com a equipe", descricao: "Equipe InfoHub analisa a proposta e agenda o 1º encontro." },
  { nome: "Encontro 1 — Entendendo a ideia", descricao: "Problema, público-alvo e solução inicial." },
  { nome: "Encontro 2 — Proposta de valor", descricao: "Construção do Value Proposition Design." },
  { nome: "Encontro 3 — Modelo de negócio", descricao: "Construção do Business Model Canvas." },
  { nome: "Encontro 4 — Pitch e inscrição", descricao: "Revisão geral, Pitch Vídeo e conferência de documentos." },
];

const STATUS_TAREFA = ["Pendente", "Em andamento", "Entregue", "Atrasada", "Aprovada", "Reprovada/Ajustar"];

async function seed() {
  console.log("Limpando dados existentes...");
  await pool.query(`
    TRUNCATE TABLE
      lembrete, entregavel, anotacoes, historico_etapa, tarefa,
      equipe_usuario, equipe_mentor, equipe, status_tarefa, etapa, usuario, cursos
    RESTART IDENTITY CASCADE
  `);

  console.log("Inserindo cursos...");
  const idCurso: Record<string, number> = {};
  for (const nome of CURSOS) {
    const { rows } = await pool.query("INSERT INTO cursos (nome) VALUES ($1) RETURNING id_curso", [nome]);
    idCurso[nome] = rows[0].id_curso;
  }

  console.log("Inserindo etapas...");
  const idEtapa: number[] = [];
  for (const etapa of ETAPAS) {
    const { rows } = await pool.query(
      "INSERT INTO etapa (nome, descricao) VALUES ($1, $2) RETURNING id_etapa",
      [etapa.nome, etapa.descricao]
    );
    idEtapa.push(rows[0].id_etapa);
  }

  console.log("Inserindo status de tarefa...");
  const idStatus: Record<string, number> = {};
  for (const status of STATUS_TAREFA) {
    const { rows } = await pool.query(
      "INSERT INTO status_tarefa (descricao) VALUES ($1) RETURNING id_status",
      [status]
    );
    idStatus[status] = rows[0].id_status;
  }

  console.log("Inserindo usuários (senha para todos: senha123)...");
  const senhaHash = await bcrypt.hash("senha123", 10);

  async function criarUsuario(
    nome: string,
    telefone: string,
    email: string,
    perfil: "admin" | "mentor" | "aluno",
    idCursoRef?: number,
    semestre?: number
  ) {
    const { rows } = await pool.query(
      `INSERT INTO usuario (nome, telefone, email, senha, perfil, id_curso, semestre)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
      [nome, telefone, email, senhaHash, perfil, idCursoRef ?? null, semestre ?? null]
    );
    return rows[0].id_usuario as number;
  }

  const uAdmin = await criarUsuario("Bruna Nunes", "55999990001", "bruna.admin@infohub.edu.br", "admin");
  const uMentorRafael = await criarUsuario("Rafael Costa", "55999990002", "rafael.mentor@infohub.edu.br", "mentor");
  const uMentorCamila = await criarUsuario("Camila Fagundes", "55999990003", "camila.mentor@infohub.edu.br", "mentor");
  const uGustavo = await criarUsuario("Gustavo Martins", "55999990004", "gustavo@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const uLarissa = await criarUsuario("Larissa Prado", "55999990005", "larissa@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const uDiego = await criarUsuario("Diego Almeida", "55999990006", "diego@aluno.edu.br", "aluno", idCurso["Administração"], 3);
  const uFernanda = await criarUsuario("Fernanda Reis", "55999990007", "fernanda@aluno.edu.br", "aluno", idCurso["Gastronomia"], 7);
  const uOtavio = await criarUsuario("Otávio Lima", "55999990008", "otavio@aluno.edu.br", "aluno", idCurso["Hotelaria"], 2);

  console.log("Inserindo equipes...");

  async function criarEquipe(dados: {
    nomeEquipe: string;
    nomeIdeia: string;
    descricaoIdeia: string;
    area: string;
    estagio: string;
    linkPitch: string | null;
    idEtapaAtual: number;
    turma: string;
    mentores: number[];
  }) {
    const { rows } = await pool.query(
      `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, link_pitch, id_etapa_atual, turma)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_equipe`,
      [dados.nomeEquipe, dados.nomeIdeia, dados.descricaoIdeia, dados.area, dados.estagio, dados.linkPitch, dados.idEtapaAtual, dados.turma]
    );
    const idEquipeNova = rows[0].id_equipe as number;
    for (const idMentor of dados.mentores) {
      await pool.query("INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1, $2)", [idEquipeNova, idMentor]);
    }
    return idEquipeNova;
  }

  const eqNutriRota = await criarEquipe({
    nomeEquipe: "NutriRota",
    nomeIdeia: "Roteirizador de refeições para restaurantes universitários",
    descricaoIdeia: "App que sugere cardápios balanceados a partir do estoque do RU.",
    area: "Saúde",
    estagio: "Prototipagem",
    linkPitch: null,
    idEtapaAtual: idEtapa[4],
    turma: "2026/1",
    mentores: [uMentorRafael],
  });

  const eqOficinaViva = await criarEquipe({
    nomeEquipe: "Oficina Viva",
    nomeIdeia: "Marketplace de peças recondicionadas para oficinas mecânicas",
    descricaoIdeia: "Conecta oficinas com estoque parado a mecânicos que precisam de peças usadas.",
    area: "Serviços",
    estagio: "Validação",
    linkPitch: null,
    idEtapaAtual: idEtapa[2],
    turma: "2026/1",
    mentores: [uMentorCamila],
  });

  const eqRaizes = await criarEquipe({
    nomeEquipe: "Raízes",
    nomeIdeia: "Plataforma de hospedagem em pousadas rurais da região",
    descricaoIdeia: "Divulga pousadas familiares que não têm presença digital hoje.",
    area: "Entretenimento",
    estagio: "Lançamento",
    linkPitch: "https://youtube.com/watch?v=exemplo-raizes",
    idEtapaAtual: idEtapa[5],
    turma: "2025/2",
    mentores: [uMentorRafael, uMentorCamila],
  });

  const eqEduPasso = await criarEquipe({
    nomeEquipe: "EduPasso",
    nomeIdeia: "Trilhas de reforço escolar gamificadas",
    descricaoIdeia: "Ainda em fase de esboço, sem validação com professores.",
    area: "Educação",
    estagio: "Apenas ideia",
    linkPitch: null,
    idEtapaAtual: idEtapa[0],
    turma: "2026/1",
    mentores: [],
  });

  console.log("Inserindo integrantes das equipes...");
  async function adicionarIntegrante(idEquipeRef: number, idUsuarioRef: number, papel: "lider" | "integrante") {
    await pool.query(
      "INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1, $2, $3)",
      [idEquipeRef, idUsuarioRef, papel]
    );
  }
  await adicionarIntegrante(eqNutriRota, uGustavo, "lider");
  await adicionarIntegrante(eqNutriRota, uLarissa, "integrante");
  await adicionarIntegrante(eqOficinaViva, uDiego, "lider");
  await adicionarIntegrante(eqRaizes, uFernanda, "lider");
  await adicionarIntegrante(eqEduPasso, uOtavio, "lider");

  console.log("Inserindo tarefas...");
  async function criarTarefa(idEquipeRef: number, idEtapaRef: number, titulo: string, descricao: string, dataLimite: string, status: string) {
    const { rows } = await pool.query(
      `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_tarefa`,
      [titulo, descricao, dataLimite, idEquipeRef, idEtapaRef, idStatus[status]]
    );
    return rows[0].id_tarefa as number;
  }

  const tDefinirProblemaNutri = await criarTarefa(eqNutriRota, idEtapa[2], "Definir problema e público-alvo", "Documento com problema, persona e hipótese de solução.", "2026-08-18", "Aprovada");
  const tVpdNutri = await criarTarefa(eqNutriRota, idEtapa[3], "Enviar Value Proposition Design", "Canvas de proposta de valor preenchido.", "2026-08-25", "Aprovada");
  await criarTarefa(eqNutriRota, idEtapa[4], "Enviar Business Model Canvas", "Canvas de modelo de negócio completo.", "2026-09-02", "Em andamento");
  await criarTarefa(eqOficinaViva, idEtapa[2], "Definir problema e público-alvo", "Documento com problema, persona e hipótese de solução.", "2026-08-29", "Reprovada/Ajustar");
  await criarTarefa(eqRaizes, idEtapa[5], "Gravar Pitch Vídeo", "Link do YouTube com até 3 minutos.", "2026-08-15", "Aprovada");
  await criarTarefa(eqRaizes, idEtapa[5], "Conferir dados de todos os integrantes", "Confirmar e-mail e curso de cada integrante.", "2026-08-14", "Aprovada");
  await criarTarefa(eqOficinaViva, idEtapa[4], "Enviar Business Model Canvas", "Canvas de modelo de negócio completo.", "2026-08-20", "Atrasada");

  console.log("Inserindo entregáveis (histórico de versões)...");
  await pool.query(
    `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario, versao) VALUES
     ($1, $2, $3, $4, 1), ($5, $6, $7, $8, 2)`,
    [
      "https://drive.google.com/vpd-nutrirota-v1", "PDF", tVpdNutri, uGustavo,
      "https://drive.google.com/vpd-nutrirota-v2", "PDF", tVpdNutri, uGustavo,
    ]
  );

  console.log("Inserindo anotações internas...");
  await pool.query(
    `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES ($1, $2, $3, $4)`,
    ["Equipe animada, mas precisa amadurecer a persona antes do próximo encontro.", uMentorRafael, eqNutriRota, idEtapa[2]]
  );

  console.log("Inserindo histórico de etapas...");
  const historico: [number, number][] = [
    [eqNutriRota, idEtapa[0]], [eqNutriRota, idEtapa[1]], [eqNutriRota, idEtapa[2]], [eqNutriRota, idEtapa[3]], [eqNutriRota, idEtapa[4]],
    [eqOficinaViva, idEtapa[0]], [eqOficinaViva, idEtapa[1]], [eqOficinaViva, idEtapa[2]],
    [eqRaizes, idEtapa[0]], [eqRaizes, idEtapa[1]], [eqRaizes, idEtapa[2]], [eqRaizes, idEtapa[3]], [eqRaizes, idEtapa[4]], [eqRaizes, idEtapa[5]],
    [eqEduPasso, idEtapa[0]],
  ];
  for (const [eq, et] of historico) {
    await pool.query("INSERT INTO historico_etapa (id_equipe, id_etapa) VALUES ($1, $2)", [eq, et]);
  }

  console.log("Inserindo lembretes...");
  await pool.query(
    `INSERT INTO lembrete (data_programada, id_tarefa) VALUES ($1, $2)`,
    ["2026-08-30", tDefinirProblemaNutri]
  );

  console.log("✅ Seed concluído com sucesso.");
  console.log(`   Admin: bruna.admin@infohub.edu.br / senha123`);
  console.log(`   Mentor: rafael.mentor@infohub.edu.br / senha123`);
  console.log(`   Aluno líder: gustavo@aluno.edu.br / senha123`);
  console.log(`   Aluno integrante: larissa@aluno.edu.br / senha123`);
}

seed()
  .catch((err) => {
    console.error("Erro ao rodar o seed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
