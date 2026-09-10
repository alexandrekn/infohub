import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { CadastroIdeiaPayload, Usuario } from "@/types";

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrarIdeia: (payload: CadastroIdeiaPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const TOKEN_KEY = "@infohub:token";
const USUARIO_KEY = "@infohub:usuario";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const usuarioSalvo = localStorage.getItem(USUARIO_KEY);
    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setCarregando(false);
  }, []);

  function persistirSessao(token: string, usuarioLogado: Usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuarioLogado));
    setUsuario(usuarioLogado);
  }

  async function login(email: string, senha: string) {
    const { token, usuario: usuarioLogado } = await authService.login(email, senha);
    persistirSessao(token, usuarioLogado);
  }

  async function cadastrarIdeia(payload: CadastroIdeiaPayload) {
    const { token, usuario: usuarioLogado } = await authService.cadastrarIdeia(payload);
    persistirSessao(token, usuarioLogado);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastrarIdeia, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
