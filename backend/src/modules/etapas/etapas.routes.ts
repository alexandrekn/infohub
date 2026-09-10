import { Router } from "express";
import { etapas } from "../../data/store";

export const etapasRoutes = Router();

etapasRoutes.get("/", (_req, res) => {
  res.json(etapas);
});
