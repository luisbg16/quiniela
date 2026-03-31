-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 002: Tablas de resultados oficiales y bracket oficial
-- Ejecutar en Supabase → SQL Editor (una sola vez)
-- ─────────────────────────────────────────────────────────────────────────────

-- Resultados reales de cada partido
CREATE TABLE IF NOT EXISTS resultados_oficiales (
  id          SERIAL PRIMARY KEY,
  partido_id  VARCHAR(100) UNIQUE NOT NULL,
  fase        VARCHAR(50)  NOT NULL DEFAULT 'grupos',
  goles_local INTEGER      NOT NULL DEFAULT 0,
  goles_vis   INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Bracket oficial administrado por el admin
CREATE TABLE IF NOT EXISTS bracket_oficial (
  id         SERIAL PRIMARY KEY,
  datos      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fila inicial si no existe
INSERT INTO bracket_oficial (datos)
  SELECT '{}'::jsonb WHERE NOT EXISTS (SELECT 1 FROM bracket_oficial);

-- Trigger para updated_at en resultados_oficiales
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resultados_updated ON resultados_oficiales;
CREATE TRIGGER trg_resultados_updated
  BEFORE UPDATE ON resultados_oficiales
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('resultados_oficiales', 'bracket_oficial');
