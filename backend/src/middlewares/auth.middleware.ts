import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verificarToken } from "../utils/jwt";
import type { PerfilUsuario } from "../types";

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Sessão expirada ou token inválido."));
  }
}

/** Restringe a rota a um ou mais perfis. Use depois de `autenticar`. */
export function permitirPerfis(...perfis: PerfilUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return next(ApiError.unauthorized());
    }
    if (!perfis.includes(req.usuario.perfil)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
