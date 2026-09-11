import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../utils/asyncHandler";

export const etapasRoutes = Router();

etapasRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query("SELECT id_etapa, nome, descricao FROM etapa ORDER BY id_etapa");
    res.json(rows);
  })
);
