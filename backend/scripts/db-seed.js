require("dotenv").config();
const { Pool } = require("pg");
const { seedDemo, verifyDemo } = require("./demo-data");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/infohub";
const DB_SCHEMA = process.env.DB_SCHEMA || "infohub_dupla";

if (!/^[a-z_][a-z0-9_]*$/.test(DB_SCHEMA)) throw new Error("DB_SCHEMA inválido.");

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, options: `-c search_path=${DB_SCHEMA}` });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await seedDemo(client);
    await verifyDemo(client);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro ao rodar o seed:", err.message);
  process.exit(1);
});
