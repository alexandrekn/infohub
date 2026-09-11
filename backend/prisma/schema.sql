-- ===========================================
-- InfoHub → InovAMF — Schema PostgreSQL
-- Baseado no banco.sql original + extensões necessárias:
--   - equipe_mentor: múltiplos mentores por equipe
--   - usuario.ativo: RF-03
--   - equipe.turma: RF-24
--   - entregavel.versao: RF-16
--   - historico_etapa: RF-08
-- ===========================================

CREATE TYPE perfil_usuario AS ENUM ('aluno', 'mentor', 'admin');
CREATE TYPE papel_equipe AS ENUM ('lider', 'integrante');
CREATE TYPE status_tarefa_enum AS ENUM (
    'Pendente', 'Em andamento', 'Entregue', 'Atrasada', 'Aprovada', 'Reprovada/Ajustar'
);

CREATE TABLE cursos (
    id_curso SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    id_curso INT,
    semestre SMALLINT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

CREATE TABLE etapa (
    id_etapa SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL
);

CREATE TABLE equipe (
    id_equipe SERIAL PRIMARY KEY,
    nome_equipe VARCHAR(100) NOT NULL,
    nome_ideia VARCHAR(100) NOT NULL,
    descricao_ideia TEXT NOT NULL,
    area_ideia VARCHAR(30) NOT NULL,
    estagio_ideia VARCHAR(30) NOT NULL,
    como_conheceu VARCHAR(30),
    link_pitch VARCHAR(255),
    id_etapa_atual INT NOT NULL,
    turma VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_etapa_atual) REFERENCES etapa(id_etapa)
);

CREATE TABLE equipe_mentor (
    id_equipe INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_equipe, id_usuario),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE equipe_usuario (
    id_equipe_usuario SERIAL PRIMARY KEY,
    id_equipe INT NOT NULL,
    id_usuario INT NOT NULL,
    papel papel_equipe NOT NULL,
    UNIQUE (id_equipe, id_usuario),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE status_tarefa (
    id_status SERIAL PRIMARY KEY,
    descricao status_tarefa_enum NOT NULL UNIQUE
);

CREATE TABLE tarefa (
    id_tarefa SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_limite DATE NOT NULL,
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    id_status INT NOT NULL,
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe) ON DELETE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa),
    FOREIGN KEY (id_status) REFERENCES status_tarefa(id_status)
);

CREATE TABLE entregavel (
    id_entregavel SERIAL PRIMARY KEY,
    arquivo_url VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_tarefa INT NOT NULL,
    id_usuario INT NOT NULL,
    versao INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE anotacoes (
    id_anotacao SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe) ON DELETE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa)
);

CREATE TABLE lembrete (
    id_lembrete SERIAL PRIMARY KEY,
    data_programada DATE NOT NULL,
    enviado BOOLEAN NOT NULL DEFAULT FALSE,
    id_tarefa INT NOT NULL,
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa) ON DELETE CASCADE
);

CREATE TABLE historico_etapa (
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_equipe, id_etapa),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe) ON DELETE CASCADE,
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa)
);
