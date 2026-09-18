import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { autenticar, permitirPerfis } from "../../middlewares/auth.middleware";
import { uploadEntrega } from "../../middlewares/upload.middleware";
import { tarefasController } from "./tarefas.controller";

export const tarefasRoutes = Router();

tarefasRoutes.use(autenticar);

// Visão geral — usada no dashboard do admin (RF-07/RF-22).
tarefasRoutes.get("/", permitirPerfis("admin"), asyncHandler(tarefasController.listarTodas));

tarefasRoutes.patch("/:id/aprovar", asyncHandler(tarefasController.aprovar));
tarefasRoutes.patch("/:id/reprovar", asyncHandler(tarefasController.reprovar));
tarefasRoutes.patch("/:id/prazo", asyncHandler(tarefasController.alterarPrazo));
tarefasRoutes.get("/:id/entregaveis", asyncHandler(tarefasController.listarEntregaveis));
tarefasRoutes.post("/:id/entregaveis", asyncHandler(tarefasController.anexarEntrega));
tarefasRoutes.post("/:id/entregaveis/upload", uploadEntrega.single("arquivo"), asyncHandler(tarefasController.anexarEntregaArquivo));
