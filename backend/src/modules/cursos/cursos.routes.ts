import { Router } from "express";
import { pool } from "../../db/pool";
import { asyncHandler } from "../../utils/asyncHandler";

export const cursosRoutes = Router();

cursosRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query("SELECT id_curso, nome FROM cursos ORDER BY id_curso");
    res.json(rows);
  })
);
