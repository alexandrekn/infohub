import { Router } from "express";
import { cursos } from "../../data/store";

export const cursosRoutes = Router();

cursosRoutes.get("/", (_req, res) => {
  res.json(cursos);
});
