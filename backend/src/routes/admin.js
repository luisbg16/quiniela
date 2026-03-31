import { Router } from "express";
import { verificarToken, soloAdmin } from "../middleware/auth.js";
import {
  guardarResultado,
  obtenerResultados,
  guardarBracketOficial,
  obtenerBracketOficial,
  calcularTodosPuntos,
  obtenerRankingPublico,
  obtenerUsuarios,
  setAfiliado,
} from "../controllers/adminController.js";

const router = Router();

// ─── Rutas públicas (sin autenticación) ──────────────────────────────────────

// GET  /api/admin/resultados          — Resultados oficiales (público, para mostrar en sitio)
router.get("/resultados",      obtenerResultados);

// GET  /api/admin/bracket             — Bracket oficial (público)
router.get("/bracket",         obtenerBracketOficial);

// GET  /api/admin/ranking             — Tabla de posiciones (público)
router.get("/ranking",         obtenerRankingPublico);

// ─── Rutas protegidas (requieren login + admin) ───────────────────────────────
router.use(verificarToken, soloAdmin);

// POST /api/admin/resultados          — Guardar resultado de un partido
router.post("/resultados",     guardarResultado);

// POST /api/admin/bracket             — Actualizar bracket oficial
router.post("/bracket",        guardarBracketOficial);

// POST /api/admin/calcular-puntos     — Recalcular puntos de todas las quinielas
router.post("/calcular-puntos", calcularTodosPuntos);

// GET  /api/admin/usuarios            — Listar todos los usuarios
router.get("/usuarios",        obtenerUsuarios);

// POST /api/admin/set-afiliado        — Marcar/desmarcar afiliado manualmente
router.post("/set-afiliado",   setAfiliado);

export default router;
