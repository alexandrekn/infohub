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

// Modelo padrão — cada equipe recebe sua própria cópia dessas 6 etapas ao
// ser criada. O mentor pode acrescentar ou remover etapas por equipe depois.
const ETAPAS_PADRAO = [
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
      equipe_usuario, equipe_mentor, etapa, equipe, status_tarefa, usuario, cursos
    RESTART IDENTITY CASCADE
  `);

  console.log("Inserindo cursos...");
  const idCurso: Record<string, number> = {};
  for (const nome of CURSOS) {
    const { rows } = await pool.query("INSERT INTO cursos (nome) VALUES ($1) RETURNING id_curso", [nome]);
    idCurso[nome] = rows[0].id_curso;
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
  void uAdmin;
  const uMentorRafael = await criarUsuario("Rafael Costa", "55999990002", "rafael.mentor@infohub.edu.br", "mentor");
  const uMentorCamila = await criarUsuario("Camila Fagundes", "55999990003", "camila.mentor@infohub.edu.br", "mentor");
  const uGustavo = await criarUsuario("Gustavo Martins", "55999990004", "gustavo@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const uLarissa = await criarUsuario("Larissa Prado", "55999990005", "larissa@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const uDiego = await criarUsuario("Diego Almeida", "55999990006", "diego@aluno.edu.br", "aluno", idCurso["Administração"], 3);
  const uFernanda = await criarUsuario("Fernanda Reis", "55999990007", "fernanda@aluno.edu.br", "aluno", idCurso["Gastronomia"], 7);
  const uOtavio = await criarUsuario("Otávio Lima", "55999990008", "otavio@aluno.edu.br", "aluno", idCurso["Hotelaria"], 2);

  console.log("Inserindo equipes e suas próprias etapas...");

  /** Cria a equipe + as 6 etapas padrão dela, e posiciona a etapa atual pela ordem (1-6) desejada. */
  async function criarEquipe(dados: {
    nomeEquipe: string;
    nomeIdeia: string;
    descricaoIdeia: string;
    area: string;
    estagio: string;
    linkPitch: string | null;
    ordemEtapaAtual: number;
    turma: string;
    mentores: number[];
  }) {
    const { rows } = await pool.query(
      `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, link_pitch, id_etapa_atual, turma)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7) RETURNING id_equipe`,
      [dados.nomeEquipe, dados.nomeIdeia, dados.descricaoIdeia, dados.area, dados.estagio, dados.linkPitch, dados.turma]
    );
    const idEquipeNova = rows[0].id_equipe as number;

    const idEtapaPorOrdem: number[] = [];
    for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
      const { rows: etapaRows } = await pool.query(
        "INSERT INTO etapa (id_equipe, nome, descricao, ordem) VALUES ($1, $2, $3, $4) RETURNING id_etapa",
        [idEquipeNova, ETAPAS_PADRAO[i].nome, ETAPAS_PADRAO[i].descricao, i + 1]
      );
      idEtapaPorOrdem.push(etapaRows[0].id_etapa);
    }

    await pool.query("UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2", [
      idEtapaPorOrdem[dados.ordemEtapaAtual - 1],
      idEquipeNova,
    ]);

    for (const idMentor of dados.mentores) {
      await pool.query("INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1, $2)", [idEquipeNova, idMentor]);
    }

    return { idEquipe: idEquipeNova, idEtapaPorOrdem };
  }

  const nutriRota = await criarEquipe({
    nomeEquipe: "NutriRota",
    nomeIdeia: "Roteirizador de refeições para restaurantes universitários",
    descricaoIdeia: "App que sugere cardápios balanceados a partir do estoque do RU.",
    area: "Saúde",
    estagio: "Prototipagem",
    linkPitch: null,
    ordemEtapaAtual: 5,
    turma: "2026/1",
    mentores: [uMentorRafael],
  });

  const oficinaViva = await criarEquipe({
    nomeEquipe: "Oficina Viva",
    nomeIdeia: "Marketplace de peças recondicionadas para oficinas mecânicas",
    descricaoIdeia: "Conecta oficinas com estoque parado a mecânicos que precisam de peças usadas.",
    area: "Serviços",
    estagio: "Validação",
    linkPitch: null,
    ordemEtapaAtual: 3,
    turma: "2026/1",
    mentores: [uMentorCamila],
  });

  const raizes = await criarEquipe({
    nomeEquipe: "Raízes",
    nomeIdeia: "Plataforma de hospedagem em pousadas rurais da região",
    descricaoIdeia: "Divulga pousadas familiares que não têm presença digital hoje.",
    area: "Entretenimento",
    estagio: "Lançamento",
    linkPitch: "https://youtube.com/watch?v=exemplo-raizes",
    ordemEtapaAtual: 6,
    turma: "2025/2",
    mentores: [uMentorRafael, uMentorCamila],
  });

  const eduPasso = await criarEquipe({
    nomeEquipe: "EduPasso",
    nomeIdeia: "Trilhas de reforço escolar gamificadas",
    descricaoIdeia: "Ainda em fase de esboço, sem validação com professores.",
    area: "Educação",
    estagio: "Apenas ideia",
    linkPitch: null,
    ordemEtapaAtual: 1,
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
  await adicionarIntegrante(nutriRota.idEquipe, uGustavo, "lider");
  await adicionarIntegrante(nutriRota.idEquipe, uLarissa, "integrante");
  await adicionarIntegrante(oficinaViva.idEquipe, uDiego, "lider");
  await adicionarIntegrante(raizes.idEquipe, uFernanda, "lider");
  await adicionarIntegrante(eduPasso.idEquipe, uOtavio, "lider");

  console.log("Inserindo tarefas...");
  async function criarTarefa(idEquipeRef: number, idEtapaRef: number, titulo: string, descricao: string, dataLimite: string, status: string) {
    const { rows } = await pool.query(
      `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_tarefa`,
      [titulo, descricao, dataLimite, idEquipeRef, idEtapaRef, idStatus[status]]
    );
    return rows[0].id_tarefa as number;
  }

  // Índices de idEtapaPorOrdem são 0-based (ordem 1 = índice 0).
  const tDefinirProblemaNutri = await criarTarefa(nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[2], "Definir problema e público-alvo", "Documento com problema, persona e hipótese de solução.", "2026-08-18", "Aprovada");
  const tVpdNutri = await criarTarefa(nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[3], "Enviar Value Proposition Design", "Canvas de proposta de valor preenchido.", "2026-08-25", "Aprovada");
  await criarTarefa(nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[4], "Enviar Business Model Canvas", "Canvas de modelo de negócio completo.", "2026-09-02", "Em andamento");
  await criarTarefa(oficinaViva.idEquipe, oficinaViva.idEtapaPorOrdem[2], "Definir problema e público-alvo", "Documento com problema, persona e hipótese de solução.", "2026-08-29", "Reprovada/Ajustar");
  await criarTarefa(raizes.idEquipe, raizes.idEtapaPorOrdem[5], "Gravar Pitch Vídeo", "Link do YouTube com até 3 minutos.", "2026-08-15", "Aprovada");
  await criarTarefa(raizes.idEquipe, raizes.idEtapaPorOrdem[5], "Conferir dados de todos os integrantes", "Confirmar e-mail e curso de cada integrante.", "2026-08-14", "Aprovada");
  await criarTarefa(oficinaViva.idEquipe, oficinaViva.idEtapaPorOrdem[4], "Enviar Business Model Canvas", "Canvas de modelo de negócio completo.", "2026-08-20", "Atrasada");

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
    ["Equipe animada, mas precisa amadurecer a persona antes do próximo encontro.", uMentorRafael, nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[2]]
  );

  console.log("Inserindo histórico de etapas...");
  const historico: [number, number][] = [
    [nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[0]], [nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[1]], [nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[2]], [nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[3]], [nutriRota.idEquipe, nutriRota.idEtapaPorOrdem[4]],
    [oficinaViva.idEquipe, oficinaViva.idEtapaPorOrdem[0]], [oficinaViva.idEquipe, oficinaViva.idEtapaPorOrdem[1]], [oficinaViva.idEquipe, oficinaViva.idEtapaPorOrdem[2]],
    [raizes.idEquipe, raizes.idEtapaPorOrdem[0]], [raizes.idEquipe, raizes.idEtapaPorOrdem[1]], [raizes.idEquipe, raizes.idEtapaPorOrdem[2]], [raizes.idEquipe, raizes.idEtapaPorOrdem[3]], [raizes.idEquipe, raizes.idEtapaPorOrdem[4]], [raizes.idEquipe, raizes.idEtapaPorOrdem[5]],
    [eduPasso.idEquipe, eduPasso.idEtapaPorOrdem[0]],
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
