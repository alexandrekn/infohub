/* Líder e integrante com roles diferentes, Perfil próprio para mentores, o video do pitch sera enviado via link
do youtube, usuário poderá participar de mais de uma equipe, não existe um número máximo de integrantes
por equipe, o sistema não terá novas etapas pós infohub, o serviço de e-mail sera o gmail com RESEND */

create table cursos(
    id_curso int primary key auto_increment,
    nome enum('Sistemas de Informação', 'Direito', 'Administração', 'Gastronomia', 'Ciências Contábeis',
    'Ontopsicologia', 'Hotelaria','Pedagogia') not null,
    semestre int enum(1,2,3,4,5,6,7,8,9,10) not null
)


create table usuario (
    id_usuario int primary key auto_increment,
    nome varchar(100) not null,
    telefone varchar(15) not null,
    email varchar(100) not null unique,
    senha varchar(100) not null,
    role enum('lider', 'integrante', 'mentor', 'admin') not null
);

create table status_tarefa (
    id_status int primary key auto_increment,
    descricao enum('Pendente', 'Em andamento', 'Entregue', 'Atrasada', 'Aprovada', 'Reprovada/Ajustar') not null
)

crate table ideia (
    id_ideia int primary key auto_increment,
    titulo varchar(100) not null,
    descricao text,
    id_equipe int not null,
    id_aluno int not null,
    id_etapa int not null,
    foreign key (id_equipe) references equipe(id_equipe),
    foreign key (id_aluno) references usuario(id_usuario),
    foreign key (id_etapa) references etapa(id_etapa)
);

create table etapa (
    id_etapa int primary key auto_increment,
    nome varchar(100) not null,
    descricao text not null,
);

create table equipe (
    id_equipe int primary key auto_increment,
    nome varchar(100) not null,
    nome_ideia varchar(100) not null,
    desc_ideia text not null,
    area_ideia enum('Saúde', 'Educação', 'Meio Ambiente', 'Tecnologia', 'Entretenimento', 'Serviços', 'outro') not null,
    estagio_ideia enum('Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento') not null,
    como_conheceu enum('Redes sociais', 'Amigos', 'Eventos', 'Outros'),
    link_pitch varchar(255),
    id_lider int not null,
    id_mentor int,
    id_integrante_1 int,
    id_integrante_2 int,
    id_etapa int not null,
    foreign key (id_lider) references usuario(id_usuario),
    foreign key (id_mentor) references usuario(id_usuario),
    foreign key (id_integrante_1) references usuario(id_usuario),
    foreign key (id_integrante_2) references usuario(id_usuario),
    foreign key (id_etapa) references etapa(id_etapa)
);

create table anotacoes(
    id_anotacao int primary key auto_increment,
    descricao text not null,
    id_usuario int not null,
    id_equipe int not null,
    id_etapa int not null,
    foreign key (id_usuario) references usuario(id_usuario),
    foreign key (id_equipe) references equipe(id_equipe),
    foreign key (id_etapa) references etapa(id_etapa)
)

create table prazos (
    id_prazo int primary key auto_increment,
    data_limite date not null,
    id_equipe int not null,
    id_etapa int not null,
    foreign key (id_equipe) references equipe(id_equipe),
    foreign key (id_etapa) references etapa(id_etapa)
)

