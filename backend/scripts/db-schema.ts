import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "../src/config/env";

async function main() {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.DB_SCHEMA)) {
    throw new Error(`DB_SCHEMA inválido: ${env.DB_SCHEMA}`);
  }

  const caminhoSchema = path.join(__dirname, "..", "prisma", "schema.sql");
  const sql = fs.readFileSync(caminhoSchema, "utf-8");

  const databaseUrl = new URL(env.DATABASE_URL);

  databaseUrl.searchParams.set(
    "options",
    `-c search_path=${env.DB_SCHEMA}`
  );

  const pool = new Pool({
    connectionString: databaseUrl.toString(),
  });

  try {
    await pool.query(sql);

    console.log(
      `✅ Tabelas criadas com sucesso no schema ${env.DB_SCHEMA}.`
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao aplicar o schema:", err.message);
  process.exitCode = 1;
});