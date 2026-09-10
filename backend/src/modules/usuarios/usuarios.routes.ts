import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { autenticar, permitirPerfis } from "../../middlewares/auth.middleware";
import { usuariosController } from "./usuarios.controller";

export const usuariosRoutes = Router();

usuariosRoutes.use(autenticar, permitirPerfis("admin"));

usuariosRoutes.get("/", asyncHandler(usuariosController.listar));
usuariosRoutes.post("/", asyncHandler(usuariosController.criar));
usuariosRoutes.patch("/:id/alternar-ativo", asyncHandler(usuariosController.alternarAtivo));
