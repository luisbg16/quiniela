/**
 * Script de inicialización de la base de datos.
 * Ejecutar UNA VEZ con: npm run db:init
 */

import pool from "./database.js";

const SQL = `
-- ─── Extensión para UUIDs (opcional, usamos SERIAL por simplicidad) ──────────
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tabla de usuarios ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100)  NOT NULL,
  apellido         VARCHAR(100)  NOT NULL,
  email            VARCHAR(150)  UNIQUE NOT NULL,
  numero_asociado  VARCHAR(50),
  telefono         VARCHAR(20),
  password_hash    VARCHAR(255)  NOT NULL,
  es_admin         BOOLEAN       DEFAULT FALSE,
  es_afiliado      BOOLEAN       DEFAULT FALSE,  -- verificado automáticamente al registrar (webservice) o manual desde admin
  activo           BOOLEAN       DEFAULT TRUE,
  fecha_registro   TIMESTAMPTZ   DEFAULT NOW(),
  ultimo_acceso    TIMESTAMPTZ
);

-- Migraciones seguras: agregar columnas si ya existe la tabla (instalaciones previas)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_afiliado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- ─── Tabla de quinielas ──────────────────────────────────────────────────────
-- predicciones: guarda TODO el estado de picks en un solo objeto JSON:
-- {
--   grupos: { A: [teamIdx1°, teamIdx2°, teamIdx3°], B: [...], ... },
--   bracket: {
--     left:  { r32: [...], qf: [...], sf: [...] },
--     right: { r32: [...], qf: [...], sf: [...] },
--     finalPick: 0|1|null,
--     thirdPick: 0|1|null
--   }
-- }
CREATE TABLE IF NOT EXISTS quinielas (
  id                  SERIAL PRIMARY KEY,
  usuario_id          INTEGER      REFERENCES usuarios(id) ON DELETE CASCADE,
  predicciones        JSONB        NOT NULL DEFAULT '{}',
  puntaje             INTEGER      DEFAULT 0,
  fecha_creacion      TIMESTAMPTZ  DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(usuario_id)  -- Una quiniela por usuario
);

-- ─── Tabla de resultados oficiales ──────────────────────────────────────────
-- El admin carga el marcador real de cada partido (fase de grupos y eliminatorias)
CREATE TABLE IF NOT EXISTS resultados_oficiales (
  id          SERIAL PRIMARY KEY,
  partido_id  VARCHAR(100) UNIQUE NOT NULL,   -- ID numérico del partido (ej: "1", "2" …)
  fase        VARCHAR(50)  NOT NULL DEFAULT 'grupos',
  goles_local INTEGER      NOT NULL DEFAULT 0,
  goles_vis   INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Tabla del bracket oficial ────────────────────────────────────────────────
-- El admin define qué equipos juegan cada ronda eliminatoria y quién avanza.
-- Una sola fila JSONB con todo el estado del bracket real.
CREATE TABLE IF NOT EXISTS bracket_oficial (
  id         SERIAL PRIMARY KEY,
  datos      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Fila inicial garantizada
INSERT INTO bracket_oficial (datos)
  SELECT '{}'::jsonb WHERE NOT EXISTS (SELECT 1 FROM bracket_oficial);

-- Migraciones seguras para instalaciones previas
ALTER TABLE resultados_oficiales ADD COLUMN IF NOT EXISTS fase VARCHAR(50) NOT NULL DEFAULT 'grupos';

-- Migración: agregar updated_at a quinielas (requerida por triggers heredados)
ALTER TABLE quinielas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Tabla de configuración de partidos ──────────────────────────────────────
-- El admin puede cerrar partidos individualmente para impedir nuevas predicciones.
-- Si un partido NO aparece en esta tabla → está abierto por defecto.
-- Si está con abierto = FALSE → el backend rechaza predicciones para ese partido.
CREATE TABLE IF NOT EXISTS partidos_config (
  partido_id  VARCHAR(100) PRIMARY KEY,
  abierto     BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quinielas_usuario_id ON quinielas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_quinielas_puntaje    ON quinielas(puntaje DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_email       ON usuarios(email);

-- ─── Función para actualizar timestamps automáticamente ──────────────────────
-- Actualiza fecha_actualizacion Y updated_at (compatibilidad con triggers heredados)
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  NEW.updated_at          = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en quinielas (reemplaza cualquier trigger anterior)
DROP TRIGGER IF EXISTS trg_quinielas_updated ON quinielas;
CREATE TRIGGER trg_quinielas_updated
  BEFORE UPDATE ON quinielas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
`;

try {
  await pool.query(SQL);
  console.log("✅  Base de datos inicializada correctamente");
  console.log("   - Tabla 'usuarios' creada");
  console.log("   - Tabla 'quinielas' creada");
  console.log("   - Índices y triggers creados");
} catch (err) {
  console.error("❌  Error al inicializar la base de datos:", err.message);
} finally {
  await pool.end();
}
