import { Pool } from "pg";
import { env } from "../config/env";

if (!/^[a-z_][a-z0-9_]*$/.test(env.DB_SCHEMA)) {
  throw new Error("DB_SCHEMA inválido. Use apenas letras minúsculas, números e underscore, começando por letra/underscore.");
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Garante que TODAS as queries do app usem exclusivamente o schema da dupla.
  options: `-c search_path=${env.DB_SCHEMA}`,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});
