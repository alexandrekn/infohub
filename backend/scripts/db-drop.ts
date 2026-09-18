import { Pool } from "pg";
import { env } from "../src/config/env";

async function main() {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.DB_SCHEMA)) {
    throw new Error(`DB_SCHEMA inválido: ${env.DB_SCHEMA}`);
  }

  if (env.DB_SCHEMA === "public") {
    throw new Error(
      "Por segurança, este script não pode apagar o schema public."
    );
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${env.DB_SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${env.DB_SCHEMA}"`);

    console.log(`✅ Schema ${env.DB_SCHEMA} recriado com sucesso.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao recriar o schema:", err.message);
  process.exitCode = 1;
});