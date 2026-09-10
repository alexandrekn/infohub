import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ erro: err.message });
  }

  if (err instanceof ZodError) {
    const detalhes = err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
    return res.status(400).json({ erro: "Dados inválidos.", detalhes });
  }

  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
