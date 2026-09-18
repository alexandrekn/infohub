import {
  ANOTACOES,
  ENTREGAVEIS,
  EQUIPES,
  ETAPAS,
  HISTORICO_ETAPAS,
  LEMBRETES,
  TAREFAS,
  USUARIOS,
} from "@/mocks/data";
import type {
  Anotacao,
  Entregavel,
  Equipe,
  Etapa,
  HistoricoEtapa,
  Lembrete,
  PerfilUsuario,
  StatusTarefa,
  Tarefa,
  Usuario,
} from "@/types";

function atraso<T>(valor: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

let proximoIdTarefa = TAREFAS.length + 1;
let proximoIdEntregavel = ENTREGAVEIS.length + 1;
let proximoIdAnotacao = ANOTACOES.length + 1;
let proximoIdLembrete = LEMBRETES.length + 1;
let proximoIdUsuarioEquipe = USUARIOS.length + 1000;

/** RF-11 — modelos de tarefa pré-configurados por etapa. */
export const MODELOS_TAREFA_POR_ETAPA: Record<number, { titulo: string; descricao: string }[]> = {
  3: [{ titulo: "Definir problema e público-alvo", descricao: "Documento com problema, persona e hipótese de solução." }],
  4: [{ titulo: "Enviar Value Proposition Design", descricao: "Canvas de proposta de valor preenchido." }],
  5: [{ titulo: "Enviar Business Model Canvas", descricao: "Canvas de modelo de negócio completo." }],
  6: [
    { titulo: "Gravar Pitch Vídeo", descricao: "Link do YouTube com até 3 minutos." },
    { titulo: "Conferir dados de todos os integrantes", descricao: "Confirmar e-mail e curso de cada integrante." },
  ],
};

export const dataServiceMock = {
  async listarEtapas(): Promise<Etapa[]> {
    return atraso(ETAPAS);
  },

  async listarEquipes(): Promise<Equipe[]> {
    return atraso(EQUIPES);
  },

  async listarEquipesDoMentor(idMentor: number): Promise<Equipe[]> {
    return atraso(EQUIPES.filter((e) => e.id_mentores?.includes(idMentor)));
  },

  async listarEquipesDoAluno(idUsuario: number): Promise<Equipe[]> {
    return atraso(EQUIPES.filter((e) => e.integrantes?.some((i) => i.id_usuario === idUsuario)));
  },

  async buscarEquipe(idEquipe: number): Promise<Equipe | undefined> {
    return atraso(EQUIPES.find((e) => e.id_equipe === idEquipe));
  },

  async listarTarefasPorEquipe(idEquipe: number): Promise<Tarefa[]> {
    return atraso(TAREFAS.filter((t) => t.id_equipe === idEquipe));
  },

  async listarTodasTarefas(): Promise<Tarefa[]> {
    return atraso(TAREFAS);
  },

  // ---- RF-09: avançar / retroceder etapa manualmente ----
  async avancarEtapa(idEquipe: number): Promise<Equipe | undefined> {
    const equipe = EQUIPES.find((e) => e.id_equipe === idEquipe);
    if (equipe && equipe.id_etapa_atual < ETAPAS.length) {
      equipe.id_etapa_atual += 1;
      HISTORICO_ETAPAS.push({
        id_equipe: idEquipe,
        id_etapa: equipe.id_etapa_atual,
        data_entrada: new Date().toISOString().slice(0, 10),
      });
    }
    return atraso(equipe, 200);
  },

  async retrocederEtapa(idEquipe: number): Promise<Equipe | undefined> {
    const equipe = EQUIPES.find((e) => e.id_equipe === idEquipe);
    if (equipe && equipe.id_etapa_atual > 1) {
      equipe.id_etapa_atual -= 1;
    }
    return atraso(equipe, 200);
  },

  async listarHistoricoEtapas(idEquipe: number): Promise<HistoricoEtapa[]> {
    return atraso(
      HISTORICO_ETAPAS.filter((h) => h.id_equipe === idEquipe).sort((a, b) => a.id_etapa - b.id_etapa)
    );
  },

  // ---- RF-10: anotações internas ----
  async listarAnotacoes(idEquipe: number): Promise<Anotacao[]> {
    return atraso(
      ANOTACOES.filter((a) => a.id_equipe === idEquipe).sort((a, b) => b.data_registro.localeCompare(a.data_registro))
    );
  },

  async criarAnotacao(dados: { idEquipe: number; idEtapa: number; idUsuario: number; descricao: string }): Promise<Anotacao> {
    const nova: Anotacao = {
      id_anotacao: proximoIdAnotacao++,
      descricao: dados.descricao,
      data_registro: new Date().toISOString(),
      id_usuario: dados.idUsuario,
      id_equipe: dados.idEquipe,
      id_etapa: dados.idEtapa,
    };
    ANOTACOES.push(nova);
    return atraso(nova, 200);
  },

  // ---- RF-11/RF-17: criar tarefa (com lembretes) ----
  async criarTarefa(dados: {
    idEquipe: number;
    idEtapa: number;
    titulo: string;
    descricao: string;
    dataLimite: string;
    datasLembrete: string[];
  }): Promise<Tarefa> {
    const nova: Tarefa = {
      id_tarefa: proximoIdTarefa++,
      titulo: dados.titulo,
      descricao: dados.descricao,
      data_limite: dados.dataLimite,
      id_equipe: dados.idEquipe,
      id_etapa: dados.idEtapa,
      status: "Pendente",
    };
    TAREFAS.push(nova);
    for (const data of dados.datasLembrete) {
      if (!data) continue;
      LEMBRETES.push({ id_lembrete: proximoIdLembrete++, data_programada: data, enviado: false, id_tarefa: nova.id_tarefa });
    }
    return atraso(nova, 250);
  },

  async listarLembretesPorTarefa(idTarefa: number): Promise<Lembrete[]> {
    return atraso(LEMBRETES.filter((l) => l.id_tarefa === idTarefa));
  },

  // ---- RF-15: aprovar / reprovar entrega ----
  async aprovarTarefa(idTarefa: number): Promise<Tarefa | undefined> {
    const tarefa = TAREFAS.find((t) => t.id_tarefa === idTarefa);
    if (tarefa) tarefa.status = "Aprovada";
    return atraso(tarefa, 200);
  },

  async reprovarTarefa(idTarefa: number, comentario: string, dados: { idEquipe: number; idEtapa: number; idUsuario: number }): Promise<Tarefa | undefined> {
    const tarefa = TAREFAS.find((t) => t.id_tarefa === idTarefa);
    if (tarefa) tarefa.status = "Reprovada/Ajustar";
    if (comentario.trim()) {
      ANOTACOES.push({
        id_anotacao: proximoIdAnotacao++,
        descricao: `Ajuste solicitado em "${tarefa?.titulo}": ${comentario}`,
        data_registro: new Date().toISOString(),
        id_usuario: dados.idUsuario,
        id_equipe: dados.idEquipe,
        id_etapa: dados.idEtapa,
      });
    }
    return atraso(tarefa, 200);
  },

  // ---- RF-14/RF-16: aluno anexa entrega, com histórico de versões ----
  async listarEntregaveisPorTarefa(idTarefa: number): Promise<Entregavel[]> {
    return atraso(ENTREGAVEIS.filter((e) => e.id_tarefa === idTarefa).sort((a, b) => a.versao - b.versao));
  },

  async anexarEntrega(dados: { idTarefa: number; idUsuario: number; arquivoUrl: string; tipo: string }): Promise<Entregavel> {
    const versaoAtual = ENTREGAVEIS.filter((e) => e.id_tarefa === dados.idTarefa).length;
    const nova: Entregavel = {
      id_entregavel: proximoIdEntregavel++,
      arquivo_url: dados.arquivoUrl,
      tipo: dados.tipo,
      data_envio: new Date().toISOString(),
      id_tarefa: dados.idTarefa,
      id_usuario: dados.idUsuario,
      versao: versaoAtual + 1,
    };
    ENTREGAVEIS.push(nova);
    const tarefa = TAREFAS.find((t) => t.id_tarefa === dados.idTarefa);
    if (tarefa && tarefa.status !== "Aprovada") tarefa.status = "Entregue";
    return atraso(nova, 250);
  },

  // ---- RF-03: administrar contas de admin/mentor ----
  async listarUsuariosPorPerfil(perfis: PerfilUsuario[]): Promise<Usuario[]> {
    return atraso(USUARIOS.filter((u) => perfis.includes(u.perfil)));
  },

  async criarUsuario(dados: { nome: string; email: string; telefone: string; perfil: PerfilUsuario }): Promise<Usuario> {
    const novo: Usuario = {
      id_usuario: proximoIdUsuarioEquipe++,
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      perfil: dados.perfil,
      ativo: true,
    };
    USUARIOS.push(novo);
    return atraso(novo, 250);
  },

  async alternarAtivoUsuario(idUsuario: number): Promise<Usuario | undefined> {
    const usuario = USUARIOS.find((u) => u.id_usuario === idUsuario);
    if (usuario) usuario.ativo = usuario.ativo === false ? true : false;
    return atraso(usuario, 150);
  },
};

// ---- RF-23: exportar equipes em CSV ----
export function exportarEquipesCSV(equipes: Equipe[], etapas: Etapa[]): void {
  const cabecalho = ["Equipe", "Ideia", "Área", "Estágio", "Etapa atual", "Turma", "Mentores"];
  const linhas = equipes.map((equipe) => {
    const etapa = etapas.find((e) => e.id_etapa === equipe.id_etapa_atual)?.nome ?? "";
    const mentores = USUARIOS.filter((u) => equipe.id_mentores?.includes(u.id_usuario))
      .map((m) => m.nome)
      .join(" | ");
    return [equipe.nome_equipe, equipe.nome_ideia, equipe.area_ideia, equipe.estagio_ideia, etapa, equipe.turma, mentores];
  });
  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `infohub-equipes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function contarPorEtapa(equipes: Equipe[]): Record<number, number> {
  return equipes.reduce<Record<number, number>>((acc, equipe) => {
    acc[equipe.id_etapa_atual] = (acc[equipe.id_etapa_atual] ?? 0) + 1;
    return acc;
  }, {});
}

export function contarTarefasPorStatus(tarefas: Tarefa[]): Record<StatusTarefa, number> {
  const base: Record<StatusTarefa, number> = {
    Pendente: 0,
    "Em andamento": 0,
    Entregue: 0,
    Atrasada: 0,
    Aprovada: 0,
    "Reprovada/Ajustar": 0,
  };
  return tarefas.reduce((acc, tarefa) => {
    acc[tarefa.status]++;
    return acc;
  }, base);
}

export function nomeUsuario(usuario?: Usuario): string {
  return usuario?.nome ?? "—";
}
