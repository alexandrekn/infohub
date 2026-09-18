import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.post("/cadastro-ideia", asyncHandler(authController.cadastrarIdeia));
authRoutes.post("/esqueci-senha", asyncHandler(authController.esqueciSenha));
