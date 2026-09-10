import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  telefone: z.string().default(""),
  perfil: z.enum(["admin", "mentor"]),
});
