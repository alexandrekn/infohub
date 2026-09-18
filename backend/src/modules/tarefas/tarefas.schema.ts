import { z } from "zod";

export const criarTarefaSchema = z.object({
  id_etapa: z.number().int().positive(),
  titulo: z.string().min(1, "Informe o título da tarefa."),
  descricao: z.string().default(""),
  data_limite: z.string().min(1, "Informe o prazo."),
  datas_lembrete: z.array(z.string()).default([]),
});

export const reprovarTarefaSchema = z.object({
  comentario: z.string().default(""),
});

export const alterarPrazoSchema = z.object({
  data_limite: z.string().min(1, "Informe o novo prazo."),
});

export const anexarEntregaSchema = z.object({
  arquivo_url: z.string().min(1, "Informe a URL do arquivo ou link."),
  tipo: z.string().default("Link"),
});

export type CriarTarefaInput = z.infer<typeof criarTarefaSchema>;
