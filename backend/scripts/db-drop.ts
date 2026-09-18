import { Pool } from "pg";
import { env } from "../src/config/env";

function validarSchema(schema: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) {
    throw new Error("DB_SCHEMA inválido.");
  }
  if (schema === "public") {
    throw new Error("Por segurança, db:drop não pode apagar o schema public.");
  }
}

async function main() {
  validarSchema(env.DB_SCHEMA);
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    await pool.query(`DROP SCHEMA IF EXISTS ${env.DB_SCHEMA} CASCADE; CREATE SCHEMA ${env.DB_SCHEMA};`);
    console.log(`✅ Schema ${env.DB_SCHEMA} recriado (somente dados da dupla foram apagados).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao apagar o schema:", err.message);
  process.exitCode = 1;
});
