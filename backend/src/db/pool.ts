import { Pool } from "pg";
import { env } from "../config/env";

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.DB_SCHEMA)) {
  throw new Error(`DB_SCHEMA inválido: ${env.DB_SCHEMA}`);
}

const databaseUrl = new URL(env.DATABASE_URL);

// Faz todas as consultas da aplicação utilizarem somente o schema da dupla.
databaseUrl.searchParams.set(
  "options",
  `-c search_path=${env.DB_SCHEMA}`
);

export const pool = new Pool({
  connectionString: databaseUrl.toString(),
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});