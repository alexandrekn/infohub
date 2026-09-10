import { anotacoes, contadores, entregaveis, lembretes, tarefas } from "../../data/store";
import { ApiError } from "../../utils/ApiError";
import type { CriarTarefaInput } from "./tarefas.schema";

export const tarefasService = {
  listarPorEquipe(idEquipe: number) {
    return tarefas.filter((t) => t.id_equipe === idEquipe);
  },

  listarTodas() {
    return tarefas;
  },

  buscarPorId(idTarefa: number) {
    const tarefa = tarefas.find((t) => t.id_tarefa === idTarefa);
    if (!tarefa) throw ApiError.notFound("Tarefa não encontrada.");
    return tarefa;
  },

  /** RF-11/RF-17 — cria a tarefa e já registra os lembretes automáticos. */
  criar(idEquipe: number, dados: CriarTarefaInput) {
    const nova = {
      id_tarefa: contadores.tarefa++,
      titulo: dados.titulo,
      descricao: dados.descricao,
      data_limite: dados.data_limite,
      id_equipe: idEquipe,
      id_etapa: dados.id_etapa,
      status: "Pendente" as const,
    };
    tarefas.push(nova);

    for (const data of dados.datas_lembrete) {
      if (!data) continue;
      lembretes.push({ id_lembrete: contadores.lembrete++, data_programada: data, enviado: false, id_tarefa: nova.id_tarefa });
    }

    return nova;
  },

  /** RF-15 */
  aprovar(idTarefa: number) {
    const tarefa = this.buscarPorId(idTarefa);
    tarefa.status = "Aprovada";
    return tarefa;
  },

  /** RF-15 — reprova e registra o comentário como anotação interna. */
  reprovar(idTarefa: number, comentario: string, contexto: { idEquipe: number; idEtapa: number; idUsuario: number }) {
    const tarefa = this.buscarPorId(idTarefa);
    tarefa.status = "Reprovada/Ajustar";

    if (comentario.trim()) {
      anotacoes.push({
        id_anotacao: contadores.anotacao++,
        descricao: `Ajuste solicitado em "${tarefa.titulo}": ${comentario}`,
        data_registro: new Date().toISOString(),
        id_usuario: contexto.idUsuario,
        id_equipe: contexto.idEquipe,
        id_etapa: contexto.idEtapa,
      });
    }
    return tarefa;
  },

  /** Alterar prazo é restrito ao mentor da equipe — checagem fica no controller. */
  alterarPrazo(idTarefa: number, novaData: string) {
    const tarefa = this.buscarPorId(idTarefa);
    tarefa.data_limite = novaData;
    return tarefa;
  },

  // ---- RF-14/RF-16: entregas com histórico de versões ----
  listarEntregaveis(idTarefa: number) {
    return entregaveis.filter((e) => e.id_tarefa === idTarefa).sort((a, b) => a.versao - b.versao);
  },

  anexarEntrega(idTarefa: number, idUsuario: number, arquivoUrl: string, tipo: string) {
    const versaoAtual = entregaveis.filter((e) => e.id_tarefa === idTarefa).length;
    const nova = {
      id_entregavel: contadores.entregavel++,
      arquivo_url: arquivoUrl,
      tipo,
      data_envio: new Date().toISOString(),
      id_tarefa: idTarefa,
      id_usuario: idUsuario,
      versao: versaoAtual + 1,
    };
    entregaveis.push(nova);

    const tarefa = this.buscarPorId(idTarefa);
    if (tarefa.status !== "Aprovada") tarefa.status = "Entregue";

    return nova;
  },
};
