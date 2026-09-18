import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UsuarioAutenticado } from "../types";

export function assinarToken(payload: UsuarioAutenticado): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verificarToken(token: string): UsuarioAutenticado {
  return jwt.verify(token, env.JWT_SECRET) as UsuarioAutenticado;
}
