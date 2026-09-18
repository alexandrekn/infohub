import { Pool } from "pg";
import { env } from "../src/config/env";

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("✅ Schema public recriado (tudo apagado).");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao apagar o schema:", err.message);
  process.exitCode = 1;
});
