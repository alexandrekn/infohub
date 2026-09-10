import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { cadastroIdeiaSchema, esqueciSenhaSchema, loginSchema } from "./auth.schema";

export const authController = {
  async login(req: Request, res: Response) {
    const { email, senha } = loginSchema.parse(req.body);
    const resultado = await authService.login(email, senha);
    res.json(resultado);
  },

  async cadastrarIdeia(req: Request, res: Response) {
    const payload = cadastroIdeiaSchema.parse(req.body);
    const resultado = await authService.cadastrarIdeia(payload);
    res.status(201).json(resultado);
  },

  async esqueciSenha(req: Request, res: Response) {
    const { email } = esqueciSenhaSchema.parse(req.body);
    await authService.solicitarRecuperacaoSenha(email);
    res.status(204).send();
  },
};
