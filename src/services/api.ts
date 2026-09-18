import axios from "axios";

// Padrão é um caminho relativo ("/api"): em dev, o Vite faz proxy pro
// backend (ver vite.config.ts); em produção, o próprio backend serve o
// frontend, então "/api" já cai no mesmo servidor — não precisa saber o
// domínio de antemão (importante pra rodar atrás do Coolify/qualquer PaaS).
// Só defina VITE_API_URL se o backend estiver num domínio diferente do frontend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@infohub:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("@infohub:token");
      localStorage.removeItem("@infohub:usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
