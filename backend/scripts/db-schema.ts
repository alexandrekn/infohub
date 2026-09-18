import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "../src/config/env";

function validarSchema(schema: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("DB_SCHEMA inválido.");
}

async function main() {
  validarSchema(env.DB_SCHEMA);
  const caminhoSchema = path.join(__dirname, "..", "prisma", "schema.sql");
  const sql = fs.readFileSync(caminhoSchema, "utf-8");

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${env.DB_SCHEMA}`);
    await client.query(`SET search_path TO ${env.DB_SCHEMA}`);
    await client.query(sql);
    console.log(`✅ Tabelas aplicadas no schema ${env.DB_SCHEMA}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao aplicar o schema:", err.message);
  process.exitCode = 1;
});
