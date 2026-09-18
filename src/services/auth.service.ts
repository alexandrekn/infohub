import { api } from "./api";
import type { CadastroIdeiaPayload, Usuario } from "@/types";

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, senha });
    return data;
  },

  /** Etapa 1 — Envio da ideia: cria a conta do líder e o registro da equipe */
  async cadastrarIdeia(payload: CadastroIdeiaPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/cadastro-ideia", payload);
    return data;
  },

  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    await api.post("/auth/esqueci-senha", { email });
  },
};
