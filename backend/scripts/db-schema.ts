import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { env } from "../src/config/env";

async function main() {
  const caminhoSchema = path.join(__dirname, "..", "prisma", "schema.sql");
  const sql = fs.readFileSync(caminhoSchema, "utf-8");

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    await pool.query(sql);
    console.log("✅ Schema aplicado com sucesso.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao aplicar o schema:", err.message);
  process.exitCode = 1;
});
