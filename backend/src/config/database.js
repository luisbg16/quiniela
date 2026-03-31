import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase y la mayoría de hosts en la nube requieren SSL
  ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌  Error conectando a PostgreSQL:", err.message);
  } else {
    release();
    console.log("✅  PostgreSQL conectado correctamente");
  }
});

export default pool;
