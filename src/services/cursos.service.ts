import { api } from "./api";
import type { Curso } from "@/types";

export const cursosService = {
  async listar(): Promise<Curso[]> {
    const { data } = await api.get<Curso[]>("/cursos");
    return data;
  },
};
