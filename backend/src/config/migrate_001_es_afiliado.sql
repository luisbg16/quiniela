-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 001: Agregar campo es_afiliado a la tabla usuarios
-- ─────────────────────────────────────────────────────────────────────────────
-- Ejecutar UNA SOLA VEZ en Supabase → SQL Editor (o psql):
--
--   \i migrate_001_es_afiliado.sql
--
-- Es seguro correr varias veces: ADD COLUMN IF NOT EXISTS no falla si ya existe.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS es_afiliado BOOLEAN NOT NULL DEFAULT FALSE;

-- Verificar resultado
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND column_name = 'es_afiliado';
