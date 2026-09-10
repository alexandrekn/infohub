import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { rotaNaoEncontrada, tratarErros } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { cursosRoutes } from "./modules/cursos/cursos.routes";
import { etapasRoutes } from "./modules/etapas/etapas.routes";
import { equipesRoutes } from "./modules/equipes/equipes.routes";
import { tarefasRoutes } from "./modules/tarefas/tarefas.routes";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/etapas", etapasRoutes);
app.use("/api/equipes", equipesRoutes);
app.use("/api/tarefas", tarefasRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);
