import express from "express";
import cors from "cors";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { pool } from "./db/pool";
import { asyncHandler } from "./utils/asyncHandler";
import { rotaNaoEncontrada, tratarErros } from "./middlewares/error.middleware";
import { NOME_PASTA_UPLOADS } from "./middlewares/upload.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { cursosRoutes } from "./modules/cursos/cursos.routes";
import { equipesRoutes } from "./modules/equipes/equipes.routes";
import { tarefasRoutes } from "./modules/tarefas/tarefas.routes";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", asyncHandler(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", database: "connected", schema: env.DB_SCHEMA });
}));

// RF-14 — arquivos enviados como entrega ficam disponíveis aqui.
app.use("/uploads", express.static(NOME_PASTA_UPLOADS));

app.use("/api/auth", authRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/equipes", equipesRoutes);
app.use("/api/tarefas", tarefasRoutes);
app.use("/api/usuarios", usuariosRoutes);

// A partir daqui, tudo que não bateu em /api ou /uploads é 404 de API de verdade.
app.use("/api", rotaNaoEncontrada);

// Serve o frontend buildado (repo-root/dist) na mesma porta — assim o app
// inteiro roda com um único comando/serviço (importante pro deploy no
// Coolify). Se `dist/` não existir (ex.: rodando só o backend em dev,
// com o frontend servido separadamente pelo Vite), esse trecho não faz nada.
const PASTA_FRONTEND = path.join(__dirname, "..", "..", "dist");
if (fs.existsSync(PASTA_FRONTEND)) {
  app.use(express.static(PASTA_FRONTEND));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(PASTA_FRONTEND, "index.html"));
  });
} else {
  app.use(rotaNaoEncontrada);
}

app.use(tratarErros);
