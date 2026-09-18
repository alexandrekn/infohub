import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { autenticar, permitirPerfis } from "../../middlewares/auth.middleware";
import { equipesController } from "./equipes.controller";
import { tarefasController } from "../tarefas/tarefas.controller";
import { anotacoesController } from "../anotacoes/anotacoes.controller";

export const equipesRoutes = Router();

equipesRoutes.use(autenticar);

equipesRoutes.get("/", permitirPerfis("admin"), asyncHandler(equipesController.listar));
equipesRoutes.get("/minhas", asyncHandler(equipesController.minhas));
equipesRoutes.get("/:id", asyncHandler(equipesController.buscarPorId));
equipesRoutes.get("/:id/historico-etapas", asyncHandler(equipesController.historico));
equipesRoutes.patch("/:id/avancar-etapa", asyncHandler(equipesController.avancarEtapa));
equipesRoutes.patch("/:id/retroceder-etapa", asyncHandler(equipesController.retrocederEtapa));

// Etapas da equipe — padrão 6, mentor pode acrescentar/remover por equipe.
equipesRoutes.get("/:id/etapas", asyncHandler(equipesController.listarEtapas));
equipesRoutes.post("/:id/etapas", asyncHandler(equipesController.adicionarEtapa));
equipesRoutes.delete("/:id/etapas/:idEtapa", asyncHandler(equipesController.removerEtapa));

// RF-20 — lembrete manual avulso.
equipesRoutes.post("/:id/lembrete-manual", asyncHandler(equipesController.lembreteManual));

// RF-11 — tarefas de uma equipe.
equipesRoutes.get("/:id/tarefas", asyncHandler(tarefasController.listarPorEquipe));
equipesRoutes.post("/:id/tarefas", asyncHandler(tarefasController.criar));

// RF-10 — anotações internas (nunca para o aluno).
equipesRoutes.get("/:id/anotacoes", permitirPerfis("admin", "mentor"), asyncHandler(anotacoesController.listar));
equipesRoutes.post("/:id/anotacoes", permitirPerfis("admin", "mentor"), asyncHandler(anotacoesController.criar));
