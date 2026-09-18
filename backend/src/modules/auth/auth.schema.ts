import { z } from "zod";

const AREAS = ["Saúde", "Educação", "Meio Ambiente", "Tecnologia", "Entretenimento", "Serviços", "Outro"] as const;
const ESTAGIOS = ["Apenas ideia", "Validação", "Prototipagem", "Lançamento"] as const;
const ORIGENS = ["Redes sociais", "Amigos", "Eventos", "Outros"] as const;

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

const integranteSchema = z.object({
  nome: z.string().min(1, "Informe o nome do integrante."),
  email: z.string().email("E-mail do integrante inválido."),
  curso: z.string().min(1, "Informe o curso do integrante."),
});

export const cadastroIdeiaSchema = z.object({
  nome_lider: z.string().min(1, "Informe seu nome completo."),
  email: z.string().email("E-mail inválido."),
  telefone: z.string().min(8, "Informe um telefone válido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  id_curso: z.number().int().positive("Selecione um curso."),
  semestre: z.number().int().positive("Informe o semestre."),
  integrantes: z.array(integranteSchema).default([]),
  nome_ideia: z.string().min(1, "Informe o nome da ideia."),
  descricao_ideia: z.string().min(1, "Descreva a ideia, mesmo que seja um esboço."),
  area_ideia: z.enum(AREAS),
  estagio_ideia: z.enum(ESTAGIOS),
  como_conheceu: z.enum(ORIGENS).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroIdeiaInput = z.infer<typeof cadastroIdeiaSchema>;
