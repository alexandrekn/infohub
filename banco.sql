-- ===========================================
-- Schema adaptado para PostgreSQL
-- ===========================================

-- Tipos ENUM (precisam ser criados antes das tabelas que os usam)
CREATE TYPE nome_curso AS ENUM (
    'Sistemas de Informação', 'Direito', 'Administração', 'Gastronomia',
    'Ciências Contábeis', 'Ontopsicologia', 'Hotelaria', 'Pedagogia'
);

CREATE TYPE perfil_usuario AS ENUM ('aluno', 'mentor', 'admin');

CREATE TYPE area_ideia_enum AS ENUM (
    'Saúde', 'Educação', 'Meio Ambiente', 'Tecnologia', 'Entretenimento', 'Serviços', 'Outro'
);

CREATE TYPE estagio_ideia_enum AS ENUM (
    'Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento'
);

CREATE TYPE como_conheceu_enum AS ENUM (
    'Redes sociais', 'Amigos', 'Eventos', 'Outros'
);

CREATE TYPE papel_equipe AS ENUM ('lider', 'integrante');

CREATE TYPE status_tarefa_enum AS ENUM (
    'Pendente', 'Em andamento', 'Entregue', 'Atrasada', 'Aprovada', 'Reprovada/Ajustar'
);

-- ===========================================
-- Cursos
-- ===========================================
CREATE TABLE cursos (
    id_curso SERIAL PRIMARY KEY,
    nome nome_curso NOT NULL
);

-- ===========================================
-- Usuários
-- ===========================================
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    id_curso INT,
    semestre SMALLINT,
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

-- ===========================================
-- Etapas
-- ===========================================
CREATE TABLE etapa (
    id_etapa SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL
);

-- ===========================================
-- Equipe
-- ===========================================
CREATE TABLE equipe (
    id_equipe SERIAL PRIMARY KEY,
    nome_equipe VARCHAR(100) NOT NULL,
    nome_ideia VARCHAR(100) NOT NULL,
    descricao_ideia TEXT NOT NULL,
    area_ideia area_ideia_enum NOT NULL,
    estagio_ideia estagio_ideia_enum NOT NULL,
    como_conheceu como_conheceu_enum,
    link_pitch VARCHAR(255),
    id_mentor INT,
    id_etapa_atual INT NOT NULL,
    FOREIGN KEY (id_mentor) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_etapa_atual) REFERENCES etapa(id_etapa)
);

-- ===========================================
-- Equipe | Usuario
-- ===========================================
CREATE TABLE equipe_usuario (
    id_equipe_usuario SERIAL PRIMARY KEY,
    id_equipe INT NOT NULL,
    id_usuario INT NOT NULL,
    papel papel_equipe NOT NULL,
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- ===========================================
-- Status das Tarefas
-- ===========================================
CREATE TABLE status_tarefa (
    id_status SERIAL PRIMARY KEY,
    descricao status_tarefa_enum NOT NULL
);

-- ===========================================
-- Tarefas
-- ===========================================
CREATE TABLE tarefa (
    id_tarefa SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_limite DATE NOT NULL,
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    id_status INT NOT NULL,
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa),
    FOREIGN KEY (id_status) REFERENCES status_tarefa(id_status)
);

-- ===========================================
-- Entregáveis
-- ===========================================
CREATE TABLE entregavel (
    id_entregavel SERIAL PRIMARY KEY,
    arquivo_url VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_tarefa INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- ===========================================
-- Anotações
-- ===========================================
CREATE TABLE anotacoes (
    id_anotacao SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa)
);

-- ===========================================
-- Lembretes
-- ===========================================
CREATE TABLE lembrete (
    id_lembrete SERIAL PRIMARY KEY,
    data_programada DATE NOT NULL,
    enviado BOOLEAN DEFAULT FALSE,
    id_tarefa INT NOT NULL,
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa)
);
