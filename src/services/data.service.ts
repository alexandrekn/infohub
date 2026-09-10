import { api } from "./api";
import type {
  Anotacao,
  Entregavel,
  Equipe,
  Etapa,
  HistoricoEtapa,
  PerfilUsuario,
  StatusTarefa,
  Tarefa,
  Usuario,
} from "@/types";

/** RF-11 — modelos de tarefa pré-configurados por etapa (mesmo conteúdo do backend). */
export const MODELOS_TAREFA_POR_ETAPA: Record<number, { titulo: string; descricao: string }[]> = {
  3: [{ titulo: "Definir problema e público-alvo", descricao: "Documento com problema, persona e hipótese de solução." }],
  4: [{ titulo: "Enviar Value Proposition Design", descricao: "Canvas de proposta de valor preenchido." }],
  5: [{ titulo: "Enviar Business Model Canvas", descricao: "Canvas de modelo de negócio completo." }],
  6: [
    { titulo: "Gravar Pitch Vídeo", descricao: "Link do YouTube com até 3 minutos." },
    { titulo: "Conferir dados de todos os integrantes", descricao: "Confirmar e-mail e curso de cada integrante." },
  ],
};

export const dataService = {
  async listarEtapas(): Promise<Etapa[]> {
    const { data } = await api.get<Etapa[]>("/etapas");
    return data;
  },

  async listarEquipes(): Promise<Equipe[]> {
    const { data } = await api.get<Equipe[]>("/equipes");
    return data;
  },

  /** O backend identifica o mentor pelo token — o parâmetro fica só por compatibilidade de assinatura. */
  async listarEquipesDoMentor(_idMentor: number): Promise<Equipe[]> {
    const { data } = await api.get<Equipe[]>("/equipes/minhas");
    return data;
  },

  async listarEquipesDoAluno(_idUsuario: number): Promise<Equipe[]> {
    const { data } = await api.get<Equipe[]>("/equipes/minhas");
    return data;
  },

  async buscarEquipe(idEquipe: number): Promise<Equipe | undefined> {
    const { data } = await api.get<Equipe>(`/equipes/${idEquipe}`);
    return data;
  },

  async listarTarefasPorEquipe(idEquipe: number): Promise<Tarefa[]> {
    const { data } = await api.get<Tarefa[]>(`/equipes/${idEquipe}/tarefas`);
    return data;
  },

  async listarTodasTarefas(): Promise<Tarefa[]> {
    const { data } = await api.get<Tarefa[]>("/tarefas");
    return data;
  },

  // ---- RF-09: avançar / retroceder etapa manualmente ----
  async avancarEtapa(idEquipe: number): Promise<Equipe> {
    const { data } = await api.patch<Equipe>(`/equipes/${idEquipe}/avancar-etapa`);
    return data;
  },

  async retrocederEtapa(idEquipe: number): Promise<Equipe> {
    const { data } = await api.patch<Equipe>(`/equipes/${idEquipe}/retroceder-etapa`);
    return data;
  },

  async listarHistoricoEtapas(idEquipe: number): Promise<HistoricoEtapa[]> {
    const { data } = await api.get<HistoricoEtapa[]>(`/equipes/${idEquipe}/historico-etapas`);
    return data;
  },

  // ---- RF-10: anotações internas ----
  async listarAnotacoes(idEquipe: number): Promise<Anotacao[]> {
    const { data } = await api.get<Anotacao[]>(`/equipes/${idEquipe}/anotacoes`);
    return data;
  },

  async criarAnotacao(dados: { idEquipe: number; idEtapa: number; idUsuario: number; descricao: string }): Promise<Anotacao> {
    const { data } = await api.post<Anotacao>(`/equipes/${dados.idEquipe}/anotacoes`, {
      id_etapa: dados.idEtapa,
      descricao: dados.descricao,
    });
    return data;
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
    const { data } = await api.post<Tarefa>(`/equipes/${dados.idEquipe}/tarefas`, {
      id_etapa: dados.idEtapa,
      titulo: dados.titulo,
      descricao: dados.descricao,
      data_limite: dados.dataLimite,
      datas_lembrete: dados.datasLembrete,
    });
    return data;
  },

  // ---- RF-15: aprovar / reprovar entrega ----
  async aprovarTarefa(idTarefa: number): Promise<Tarefa> {
    const { data } = await api.patch<Tarefa>(`/tarefas/${idTarefa}/aprovar`);
    return data;
  },

  async reprovarTarefa(
    idTarefa: number,
    comentario: string,
    _dados: { idEquipe: number; idEtapa: number; idUsuario: number }
  ): Promise<Tarefa> {
    const { data } = await api.patch<Tarefa>(`/tarefas/${idTarefa}/reprovar`, { comentario });
    return data;
  },

  /** Restrito ao mentor da equipe — o backend recusa qualquer outro perfil. */
  async alterarPrazoTarefa(idTarefa: number, novaData: string): Promise<Tarefa> {
    const { data } = await api.patch<Tarefa>(`/tarefas/${idTarefa}/prazo`, { data_limite: novaData });
    return data;
  },

  // ---- RF-14/RF-16: aluno anexa entrega, com histórico de versões ----
  async listarEntregaveisPorTarefa(idTarefa: number): Promise<Entregavel[]> {
    const { data } = await api.get<Entregavel[]>(`/tarefas/${idTarefa}/entregaveis`);
    return data;
  },

  async anexarEntrega(dados: { idTarefa: number; idUsuario: number; arquivoUrl: string; tipo: string }): Promise<Entregavel> {
    const { data } = await api.post<Entregavel>(`/tarefas/${dados.idTarefa}/entregaveis`, {
      arquivo_url: dados.arquivoUrl,
      tipo: dados.tipo,
    });
    return data;
  },

  // ---- RF-03: administrar contas de admin/mentor ----
  async listarUsuariosPorPerfil(perfis: PerfilUsuario[]): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>("/usuarios", { params: { perfil: perfis.join(",") } });
    return data;
  },

  async criarUsuario(dados: { nome: string; email: string; telefone: string; perfil: PerfilUsuario }): Promise<Usuario> {
    const { data } = await api.post<Usuario>("/usuarios", dados);
    return data;
  },

  async alternarAtivoUsuario(idUsuario: number): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/usuarios/${idUsuario}/alternar-ativo`);
    return data;
  },
};

// ---- RF-23: exportar equipes em CSV (client-side, não depende do backend) ----
export function exportarEquipesCSV(equipes: Equipe[], etapas: Etapa[]): void {
  const cabecalho = ["Equipe", "Ideia", "Área", "Estágio", "Etapa atual", "Turma", "Mentores"];
  const linhas = equipes.map((equipe) => {
    const etapa = etapas.find((e) => e.id_etapa === equipe.id_etapa_atual)?.nome ?? "";
    const mentores = (equipe.mentores ?? []).map((m) => m.nome).join(" | ");
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
