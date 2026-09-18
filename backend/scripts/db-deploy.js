require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { seedDemo, verifyDemo } = require("./demo-data");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/infohub";
const DB_SCHEMA = process.env.DB_SCHEMA || "infohub_dupla";

function validarSchema(schema) {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) {
    throw new Error("DB_SCHEMA inválido. Use apenas letras minúsculas, números e underscore, começando por letra/underscore.");
  }
  if (schema === "public") {
    throw new Error("Por segurança, o deploy não pode recriar o schema public. Configure o schema exclusivo da dupla em DB_SCHEMA.");
  }
}

async function main() {
  validarSchema(DB_SCHEMA);
  const caminhoSchema = path.join(__dirname, "..", "prisma", "schema.sql");
  const ddl = fs.readFileSync(caminhoSchema, "utf8");
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log(`[deploy-db] Preparando schema ${DB_SCHEMA}...`);
    await client.query("BEGIN");
    await client.query(`DROP SCHEMA IF EXISTS ${DB_SCHEMA} CASCADE`);
    await client.query(`CREATE SCHEMA ${DB_SCHEMA}`);
    await client.query(`SET LOCAL search_path TO ${DB_SCHEMA}`);
    await client.query(ddl);
    await seedDemo(client);
    await verifyDemo(client);
    await client.query("COMMIT");
    console.log(`[deploy-db] ✅ Schema ${DB_SCHEMA}, tabelas e seed criados com sucesso.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[deploy-db] ❌ Falha ao preparar o banco:", err.message);
  process.exit(1);
});
