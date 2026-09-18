const bcrypt = require("bcryptjs");

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

const ETAPAS_PADRAO = [
  { nome: "Envio da ideia", descricao: "Aluno preenche o formulário inicial contando a ideia." },
  { nome: "Contato com a equipe", descricao: "Equipe InfoHub analisa a proposta e conduz o primeiro contato." },
  { nome: "Encontro 1 — Entendendo a ideia", descricao: "Problema, público-alvo e solução inicial." },
  { nome: "Encontro 2 — Proposta de valor", descricao: "Construção do Value Proposition Design." },
  { nome: "Encontro 3 — Modelo de negócio", descricao: "Construção do Business Model Canvas." },
  { nome: "Encontro 4 — Pitch e inscrição", descricao: "Revisão geral, Pitch Vídeo e conferência de documentos." },
];

const STATUS_TAREFA = ["Pendente", "Em andamento", "Entregue", "Atrasada", "Aprovada", "Reprovada/Ajustar"];

function dataRelativa(dias) {
  const data = new Date();
  data.setUTCHours(12, 0, 0, 0);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

async function seedDemo(client) {
  console.log("[seed] Limpando somente as tabelas do schema da dupla...");
  await client.query(`
    TRUNCATE TABLE
      lembrete, entregavel, anotacoes, historico_etapa, tarefa,
      equipe_usuario, equipe_mentor, etapa, equipe, status_tarefa, usuario, cursos
    RESTART IDENTITY CASCADE
  `);

  const idCurso = {};
  for (const nome of CURSOS) {
    const { rows } = await client.query("INSERT INTO cursos (nome) VALUES ($1) RETURNING id_curso", [nome]);
    idCurso[nome] = rows[0].id_curso;
  }

  const idStatus = {};
  for (const status of STATUS_TAREFA) {
    const { rows } = await client.query(
      "INSERT INTO status_tarefa (descricao) VALUES ($1) RETURNING id_status",
      [status]
    );
    idStatus[status] = rows[0].id_status;
  }

  const senhaHash = await bcrypt.hash("senha123", 10);
  async function criarUsuario(nome, telefone, email, perfil, curso, semestre) {
    const { rows } = await client.query(
      `INSERT INTO usuario (nome, telefone, email, senha, perfil, id_curso, semestre)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
      [nome, telefone, email, senhaHash, perfil, curso ?? null, semestre ?? null]
    );
    return rows[0].id_usuario;
  }

  // 1 administrador.
  await criarUsuario("Bruna Nunes", "55999990001", "bruna.admin@infohub.edu.br", "admin");

  // 4 mentores. Rafael atende 2 equipes; Camila atende a terceira.
  const mentorRafael = await criarUsuario("Rafael Costa", "55999990002", "rafael.mentor@infohub.edu.br", "mentor");
  const mentorCamila = await criarUsuario("Camila Fagundes", "55999990003", "camila.mentor@infohub.edu.br", "mentor");
  await criarUsuario("Marcos Vieira", "55999990004", "marcos.mentor@infohub.edu.br", "mentor");
  await criarUsuario("Juliana Lopes", "55999990005", "juliana.mentor@infohub.edu.br", "mentor");

  // 9 alunos: 3 por equipe, exatamente 1 líder por equipe.
  const gustavo = await criarUsuario("Gustavo Martins", "55999990101", "gustavo@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const larissa = await criarUsuario("Larissa Prado", "55999990102", "larissa@aluno.edu.br", "aluno", idCurso["Sistemas de Informação"], 5);
  const lucas = await criarUsuario("Lucas Moraes", "55999990103", "lucas@aluno.edu.br", "aluno", idCurso["Administração"], 4);

  const diego = await criarUsuario("Diego Almeida", "55999990201", "diego@aluno.edu.br", "aluno", idCurso["Administração"], 3);
  const fernanda = await criarUsuario("Fernanda Reis", "55999990202", "fernanda@aluno.edu.br", "aluno", idCurso["Gastronomia"], 7);
  const otavio = await criarUsuario("Otávio Lima", "55999990203", "otavio@aluno.edu.br", "aluno", idCurso["Hotelaria"], 2);

  const ana = await criarUsuario("Ana Ribeiro", "55999990301", "ana@aluno.edu.br", "aluno", idCurso["Direito"], 6);
  const pedro = await criarUsuario("Pedro Silveira", "55999990302", "pedro@aluno.edu.br", "aluno", idCurso["Ciências Contábeis"], 5);
  const sofia = await criarUsuario("Sofia Weber", "55999990303", "sofia@aluno.edu.br", "aluno", idCurso["Pedagogia"], 4);

  async function criarEquipe(dados) {
    const { rows } = await client.query(
      `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, link_pitch, id_etapa_atual, turma)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7) RETURNING id_equipe`,
      [dados.nomeEquipe, dados.nomeIdeia, dados.descricaoIdeia, dados.area, dados.estagio, dados.linkPitch ?? null, "2026/2"]
    );
    const idEquipe = rows[0].id_equipe;
    const etapas = [];

    for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
      const etapa = ETAPAS_PADRAO[i];
      const { rows: etapaRows } = await client.query(
        "INSERT INTO etapa (id_equipe, nome, descricao, ordem) VALUES ($1, $2, $3, $4) RETURNING id_etapa",
        [idEquipe, etapa.nome, etapa.descricao, i + 1]
      );
      etapas.push(etapaRows[0].id_etapa);
    }

    await client.query("UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2", [etapas[dados.ordemEtapaAtual - 1], idEquipe]);
    for (const idMentor of dados.mentores) {
      await client.query("INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1, $2)", [idEquipe, idMentor]);
    }
    return { idEquipe, etapas };
  }

  // Duas equipes já concluíram a Etapa 1 e estão cursando a Etapa 2.
  const nutriRota = await criarEquipe({
    nomeEquipe: "NutriRota",
    nomeIdeia: "Roteirizador de refeições para restaurantes universitários",
    descricaoIdeia: "App que sugere cardápios balanceados a partir do estoque disponível.",
    area: "Saúde",
    estagio: "Prototipagem",
    ordemEtapaAtual: 2,
    mentores: [mentorRafael],
  });

  const oficinaViva = await criarEquipe({
    nomeEquipe: "Oficina Viva",
    nomeIdeia: "Marketplace de peças recondicionadas para oficinas mecânicas",
    descricaoIdeia: "Conecta oficinas com estoque parado a mecânicos que precisam de peças usadas.",
    area: "Serviços",
    estagio: "Validação",
    ordemEtapaAtual: 2,
    mentores: [mentorRafael],
  });

  // Terceira equipe: usada para demonstrar tarefa com prazo atrasado.
  const raizes = await criarEquipe({
    nomeEquipe: "Raízes",
    nomeIdeia: "Plataforma de hospedagem em pousadas rurais da região",
    descricaoIdeia: "Divulga pousadas familiares e experiências de turismo rural.",
    area: "Entretenimento",
    estagio: "Prototipagem",
    ordemEtapaAtual: 3,
    mentores: [mentorCamila],
  });

  async function adicionarIntegrante(idEquipe, idUsuario, papel) {
    await client.query("INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1, $2, $3)", [idEquipe, idUsuario, papel]);
  }

  await adicionarIntegrante(nutriRota.idEquipe, gustavo, "lider");
  await adicionarIntegrante(nutriRota.idEquipe, larissa, "integrante");
  await adicionarIntegrante(nutriRota.idEquipe, lucas, "integrante");

  await adicionarIntegrante(oficinaViva.idEquipe, diego, "lider");
  await adicionarIntegrante(oficinaViva.idEquipe, fernanda, "integrante");
  await adicionarIntegrante(oficinaViva.idEquipe, otavio, "integrante");

  await adicionarIntegrante(raizes.idEquipe, ana, "lider");
  await adicionarIntegrante(raizes.idEquipe, pedro, "integrante");
  await adicionarIntegrante(raizes.idEquipe, sofia, "integrante");

  async function criarTarefa(idEquipe, idEtapa, titulo, descricao, dataLimite, status) {
    const { rows } = await client.query(
      `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_tarefa`,
      [titulo, descricao, dataLimite, idEquipe, idEtapa, idStatus[status]]
    );
    return rows[0].id_tarefa;
  }

  // Etapa 1 aprovada nas duas equipes que estão cursando a Etapa 2.
  const tNutriEtapa1 = await criarTarefa(
    nutriRota.idEquipe,
    nutriRota.etapas[0],
    "Aprovação da ideia inicial",
    "Validação do envio inicial da ideia.",
    dataRelativa(-14),
    "Aprovada"
  );
  await criarTarefa(
    nutriRota.idEquipe,
    nutriRota.etapas[1],
    "Preparar primeiro encontro",
    "Organizar dúvidas, problema e público-alvo para o contato com a equipe.",
    dataRelativa(7),
    "Em andamento"
  );

  const tOficinaEtapa1 = await criarTarefa(
    oficinaViva.idEquipe,
    oficinaViva.etapas[0],
    "Aprovação da ideia inicial",
    "Validação do envio inicial da ideia.",
    dataRelativa(-12),
    "Aprovada"
  );
  await criarTarefa(
    oficinaViva.idEquipe,
    oficinaViva.etapas[1],
    "Agendar contato com a equipe",
    "Definir pauta e disponibilidade para o primeiro encontro.",
    dataRelativa(10),
    "Pendente"
  );

  // Terceira equipe com UMA tarefa vencida/atrasada; as demais não vencem no deploy.
  await criarTarefa(raizes.idEquipe, raizes.etapas[0], "Validar cadastro inicial", "Conferência da submissão.", dataRelativa(-25), "Aprovada");
  await criarTarefa(raizes.idEquipe, raizes.etapas[1], "Concluir contato inicial", "Registro do primeiro contato com a equipe.", dataRelativa(-18), "Aprovada");
  await criarTarefa(
    raizes.idEquipe,
    raizes.etapas[2],
    "Entregar definição do problema",
    "Documento com problema, público-alvo e hipótese inicial.",
    dataRelativa(-5),
    "Atrasada"
  );

  // Evidências simples para os fluxos de detalhe/entregáveis.
  await client.query(
    `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario, versao) VALUES
      ($1, 'PDF', $2, $3, 1),
      ($4, 'PDF', $5, $6, 1)`,
    [
      "https://drive.google.com/exemplo-nutrirota-etapa1", tNutriEtapa1, gustavo,
      "https://drive.google.com/exemplo-oficinaviva-etapa1", tOficinaEtapa1, diego,
    ]
  );

  await client.query(
    `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES
      ($1, $2, $3, $4), ($5, $6, $7, $8)`,
    [
      "Etapa 1 aprovada. Preparar o primeiro contato com a equipe.", mentorRafael, nutriRota.idEquipe, nutriRota.etapas[0],
      "Equipe com tarefa vencida; revisar o prazo durante a demonstração.", mentorCamila, raizes.idEquipe, raizes.etapas[2],
    ]
  );

  for (const equipe of [nutriRota, oficinaViva]) {
    await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa, data_entrada) VALUES ($1, $2, $3)", [equipe.idEquipe, equipe.etapas[0], dataRelativa(-20)]);
    await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa, data_entrada) VALUES ($1, $2, $3)", [equipe.idEquipe, equipe.etapas[1], dataRelativa(-7)]);
  }
  await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa, data_entrada) VALUES ($1, $2, $3)", [raizes.idEquipe, raizes.etapas[0], dataRelativa(-35)]);
  await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa, data_entrada) VALUES ($1, $2, $3)", [raizes.idEquipe, raizes.etapas[1], dataRelativa(-25)]);
  await client.query("INSERT INTO historico_etapa (id_equipe, id_etapa, data_entrada) VALUES ($1, $2, $3)", [raizes.idEquipe, raizes.etapas[2], dataRelativa(-12)]);

  console.log("[seed] Dados de demonstração inseridos.");
}

async function verifyDemo(client) {
  const falhas = [];

  const totalEquipes = Number((await client.query("SELECT COUNT(*)::int AS total FROM equipe")).rows[0].total);
  if (totalEquipes !== 3) falhas.push(`esperado 3 equipes, encontrado ${totalEquipes}`);

  const equipesInvalidas = (await client.query(`
    SELECT e.nome_equipe,
           COUNT(eu.id_usuario)::int AS integrantes,
           COUNT(*) FILTER (WHERE eu.papel = 'lider')::int AS lideres
    FROM equipe e
    LEFT JOIN equipe_usuario eu ON eu.id_equipe = e.id_equipe
    GROUP BY e.id_equipe, e.nome_equipe
    HAVING COUNT(eu.id_usuario) < 3 OR COUNT(*) FILTER (WHERE eu.papel = 'lider') <> 1
  `)).rows;
  if (equipesInvalidas.length) falhas.push(`equipes com integrantes/líder inválidos: ${equipesInvalidas.map((e) => e.nome_equipe).join(", ")}`);

  const perfis = (await client.query(`
    SELECT perfil::text, COUNT(*)::int AS total
    FROM usuario
    WHERE perfil IN ('admin', 'mentor')
    GROUP BY perfil
  `)).rows;
  const porPerfil = Object.fromEntries(perfis.map((r) => [r.perfil, Number(r.total)]));
  if (porPerfil.admin !== 1) falhas.push(`esperado 1 administrador, encontrado ${porPerfil.admin ?? 0}`);
  if (porPerfil.mentor !== 4) falhas.push(`esperado 4 mentores, encontrado ${porPerfil.mentor ?? 0}`);

  const distribuicaoMentores = (await client.query(`
    SELECT u.nome, COUNT(em.id_equipe)::int AS equipes
    FROM usuario u
    LEFT JOIN equipe_mentor em ON em.id_usuario = u.id_usuario
    WHERE u.perfil = 'mentor'
    GROUP BY u.id_usuario, u.nome
    ORDER BY equipes DESC, u.nome
  `)).rows.map((r) => Number(r.equipes));
  if (distribuicaoMentores.join(",") !== "2,1,0,0") {
    falhas.push(`distribuição de mentorias esperada 2,1,0,0; encontrada ${distribuicaoMentores.join(",")}`);
  }

  const equipesEtapa2 = Number((await client.query(`
    SELECT COUNT(*)::int AS total
    FROM equipe e
    JOIN etapa atual ON atual.id_etapa = e.id_etapa_atual
    WHERE atual.ordem = 2
      AND EXISTS (
        SELECT 1
        FROM tarefa t
        JOIN etapa etapa1 ON etapa1.id_etapa = t.id_etapa
        JOIN status_tarefa st ON st.id_status = t.id_status
        WHERE t.id_equipe = e.id_equipe
          AND etapa1.ordem = 1
          AND st.descricao = 'Aprovada'
      )
  `)).rows[0].total);
  if (equipesEtapa2 !== 2) falhas.push(`esperado 2 equipes com Etapa 1 aprovada cursando Etapa 2, encontrado ${equipesEtapa2}`);

  const equipesComAtraso = Number((await client.query(`
    SELECT COUNT(DISTINCT t.id_equipe)::int AS total
    FROM tarefa t
    JOIN status_tarefa st ON st.id_status = t.id_status
    WHERE t.data_limite < CURRENT_DATE AND st.descricao = 'Atrasada'
  `)).rows[0].total);
  if (equipesComAtraso !== 1) falhas.push(`esperado 1 equipe com tarefa atrasada, encontrado ${equipesComAtraso}`);

  if (falhas.length) {
    throw new Error(`Seed fora da rubrica:\n- ${falhas.join("\n- ")}`);
  }

  console.log("[seed] ✅ Cenário validado: 3 equipes; 3+ integrantes/1 líder; 1 admin; 4 mentores; mentorias 2+1; 2 equipes na Etapa 2; 1 equipe com atraso.");
  console.log("[seed] Credenciais (senha para todas): senha123");
  console.log("       Admin:  bruna.admin@infohub.edu.br");
  console.log("       Mentor: rafael.mentor@infohub.edu.br");
  console.log("       Aluno:  gustavo@aluno.edu.br");
}

module.exports = { seedDemo, verifyDemo };
